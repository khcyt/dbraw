// coding: utf-8
import { initContext, kh_global, } from '/contrib/jsm/kh_module_context.js';
const cf = 'kh_server'; // context flag
const mf = 'common_express_app_esm'; // module flag
const { cs, ms } = initContext(cf, mf);
import { isEmpty, isValid, string2bool, isProductionLazy, } from '/contrib/jsm/kh_earlybird.js';
import { Error, } from '/contrib/jsm/kh_classes.js';
import * as mergePatch from 'json8-merge-patch';
import { default as express } from 'express';
export async function createApp(server_settings = cs.server_settings) {
    const app = express();
    // Siehe https://levelup.gitconnected.com/node-js-best-practices-security-attacks-999a82fe5c36 für weitere Security-Tipps
    app.disable('x-powered-by'); // macht helmet auch.
    // use_helmet kann auf true, false oder undefined/null (wird als false gewertet) stehen oder ein Objekt mit weiteren an helmet zu übergebenen Optionen enthalten. Standard-
    // mäßig ist contentSecurityPolicy : false, da alles andere in einer Katastrophe enden kann (ein Großteil an externen JS Skripten wird nicht geladen bzw. alles mit eval,
    // new Function() nicht mehr ausgeführt wird). Inzwischen können wir uns da mit
    //          <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net/npm/ https://code.jquery.com;
    //                              child-src 'none'; object-src 'none'; img-src 'self'  https://code.jquery.com;"></meta>
    // schon gut helfen
    //
    // Siehe https://stackoverflow.com/a/70757834 warum wir crossOriginEmbedderPolicy standardmäßig auf false setzen (ab helmet 5)
    if (isValid(server_settings.app_settings?.use_helmet) && false !== server_settings.app_settings.use_helmet) {
        const { default: helmet } = await import('helmet');
        app.use(helmet(mergePatch.apply({ contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            originAgentCluster: false,
        }, true === server_settings.app_settings.use_helmet ? {} : server_settings.app_settings.use_helmet)));
        // Entweder oben contentSecurityPolicy auf false und hier genauer spezifizieren. Ist gleichzeitig <meta http-equiv="Content-Security-Policy" in der html-Datei gesetzt,
        // werden diese Angaben verwendet (oder auch nicht ????). Setzen wir oben auf false und kommentieren hier aus, werden die Angaben in der HTML nicht verwendet. Diese
        // werden evtl. genutzt, wenn wir helmet nicht verwenden.
        /*
        app.use(helmet.contentSecurityPolicy({
            directives: {
                'default-src'   : [ `'self'` ],
                'base-uri'      : [ `'self'` ],
                'script-src'    : [ `'self'`, `'unsafe-eval'`, `'unsafe-inline'`, 'https://cdn.jsdelivr.net/', 'https://code.jquery.com/' ],
                'child-src'     : [ `'self'` ],
                'object-src'    : [ `'self'` ],
                'img-src'       : [ `'self'`, 'data:' ],
                'style-src'     : [ `'self'`, 'https:', `'unsafe-inline'` ],
                'font-src'      : [ `'self'`, 'https:', 'data:' ],
            },
            reportOnly: true,       // nur reporten, aber nicht blockieren
            }));
            */
    }
    // use_morgan kann auf true, false oder undefined/null (wird als false gewertet) stehen oder einen der predefined format-Strings enthalten.
    // morgan funktioniert auch nur, wenn es vor anderen Middleware's die möglicherweise kein next() rufen, eingesetzt wird.
    // Damit die Ausgaben auch in der Debugging Konsole von VSC ichtbar sind, müssen die Einträge "console": "internalConsole", "outputCapture": "std" in die launch.json über-
    // nommen werden.
    if (isValid(server_settings.app_settings?.use_morgan) && false !== server_settings.app_settings.use_morgan) {
        const { default: morgan } = await import('morgan');
        const short_frmt = true == server_settings.app_settings?.use_morgan ? 'tiny' : server_settings.app_settings?.use_morgan;
        app.use(morgan(short_frmt));
    }
    if (!isEmpty(server_settings.app_settings.static_files_pathes)) {
        server_settings.app_settings.static_files_pathes.forEach(_static_files_path => app.use(express.static(_static_files_path)));
    }
    // Ab Express 4.16 nehmen wir nicht mehr bodyParser, sondern die eingebauten Middleware-Objekte (die auf bodyParser aufbauen ;-) ). Siehe express-Request Doku, wenn kom-
    // plexere Daten gehandelt werden müssen oder (was sogar empfohlen wird) der passende Parser-Typ in der Route vor dem eigentlichen Handler eingebunden wird (siehe auch die
    // Beispiele unter https://expressjs.com/en/resources/middleware/body-parser.html).
    //
    // rawbody um z. B. Bilddaten vom Clienten zu empfangen. Alte Variante mit require('raw-body') in der Sicherung vor 20201126.
    if (true == server_settings.app_settings.rawbody?.use) {
        const contentType = await import('content-type');
        app.use(express.raw({ inflate: true,
            limit: server_settings.app_settings.rawbody.limit ?? '50mb',
            // raw() bei jedem Request zwischenzuschalten ist gefährlich, weil es den Inputstream ausliest. Liegen keine Binärdaten vor, hängt im Anschluss
            // der jsonParser(), weil er keine Daten bekommt. Wir müssen entweder den body selbst nach JSON-Daten untersuchen oder den Einsatz von
            // getRawBody() auf bestimmte MIME-Typen beschränken.
            type: function (req) {
                let encoding = 'utf8';
                let content_type;
                try {
                    content_type = contentType.parse(req.headers['content-type']);
                    // charset ist nur gesetzt wenn Content-Type z. B. in dieser Form «text/html;charset=utf-8» angegeben wurde.
                    encoding = content_type?.parameters.charset ?? 'utf8';
                }
                catch (error) { } // error z. B. bei get-Request, weil logischerweise kein Wert gesetzt.
                return -1 == content_type?.type.indexOf('json');
            },
            verify: function (req, res, buf, encoding) {
                req.encoding = encoding;
            }
        }));
    }
    // Siehe https://stackoverflow.com/questions/19917401/error-request-entity-too-large zu den Limits
    app.use(express.json(server_settings.app_settings.json)); // z. B. { limit: '50mb' }
    app.use(express.urlencoded(server_settings.app_settings.urlencoded)); // z. B. { limit: '50mb', extended : true }
    // lazy mit true übergeben, um "true/false" zu verarbeiten, aber "weak/strong" zu erhalten. Die Meinung tendiert inzwischen dazu, auf ETag Header zu verzichten. Wir hatten
    // kurzzeitig begonnen ETag und Caching auf der Serverseite einzubauen. Hat aber nichts gebracht. Die Quellen dazu in der Sicherung unter 2020/0903.
    app.set('etag', (server_settings.etag = string2bool(server_settings.etag, undefined, true)) ?? 'weak');
    app.set('trust proxy', isProductionLazy);
    app.set('strict routing', false); // /foo soll /foo/ entsprechen
    return app;
}
import { use_handler_one as uho, use_handler_query as uhq, use_handler_validation as uhv, use_handler_headers as uhh, } from '/common/server_std_handler.mjs';
export function use_handler_one(app) {
    return app.use(function (req, res, next) {
        const ori_send = res.send;
        Object.defineProperty(res, 'send', {
            value: function (body, status, headers) {
                'use strict';
                if (this == null) {
                    throw new TypeError('Response.prototype.send called on null or undefined');
                }
                status ||= 200;
                if (!isEmpty(headers))
                    this.set(headers);
                this.status(status);
                ori_send.call(this, body);
                return this;
            },
            enumerable: false,
            configurable: true, // kann gelöscht werden
            writable: true // kann überschrieben werden
        });
        Object.defineProperty(req, '$query', { get() { return this.query; }, });
        Object.defineProperty(req, 'arrayBuffer', { value: function () {
                if (Uint8Array.isUint8Array(this.body)) {
                    // in @hono\node-server\dist\index wird es so gemacht. buffer.buffer ist bereits vom Typ ArrayBuffer
                    return Promise.resolve(this.body.buffer.slice(this.body.byteOffset, this.body.byteOffset + this.body.byteLength));
                    /*
                    const arrayBuffer= new ArrayBuffer(buffer.length);
                    const view= new Uint8Array(arrayBuffer);
                    for (let i = 0; i < buffer.length; ++i) view[i] = buffer[i];
                    return Promise.resolve(arrayBuffer);
                    */
                }
                else
                    return Promise.reject(new Error({ msg: ['invalid-type', 'req.body',], }));
            }, });
        return uho(req, res, next);
    });
}
export function use_handler_query(app) {
    return app.use(function (req, res, next) {
        return uhq(req, res, next);
    });
}
export function use_handler_validation(app) {
    return app.use(function (req, res, next) {
        return uhv(req, res, next);
    });
}
export function use_handler_headers(app) {
    return app.use(function (req, res, next) {
        return uhh(req, res, next);
    });
}
export function sendJSON(res, o, status) {
    if (isValid(status))
        res.status(status);
    return res.json(o);
}
export function setStatus(res, status) {
    return res.status(status);
}
export function redirect(res, path, status) {
    return status ? res.redirect(status, path) : res.redirect(path);
}
export function mountRouter(app, router) { return app.use(router); }
/*
// send ist nicht Bestandteil des Prototyps
if (true!== ms.proto_inst) {
        const ori_send= Response.prototype.send as unknown as (chunk : string|Uint8Array|Array< any >) => void;
        Object.defineProperty(Response.prototype, 'send', {
                value			: function(body : string|Uint8Array|Array<any>, status : number, headers? : Record< string, string|string[] >) {
                        'use strict';
                        if (this== null) 					{ throw new TypeError('Response.prototype.send called on null or undefined'); }
                        status||= 200;
                        this.writeHead(status, headers);
                        ori_send.call(this, body);
                        return this;
                        },
                enumerable		: false,
                configurable	: true,			// kann gelöscht werden
                writable		: true			// kann überschrieben werden
            },
        );
    ms.proto_inst= true;
}
*/
kh_global.LoadedScripts.get(mf).resolve(ms);
