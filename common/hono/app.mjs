// coding: utf-8
import { initContext, kh_global, } from '/contrib/jsm/kh_module_context.js';
const cf = 'kh_server'; // context flag
const mf = 'common_hono_app_esm'; // module flag
const { cs, ms } = initContext(cf, mf);
import { Hono, } from 'hono';
import { routePath, baseRoutePath, } from 'hono/route'; // https://hono.dev/docs/helpers/route
import mime from 'mime'; // wir nehmen immer mime; mime-types ist aber auch OK.
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { methodNotAllowed } from 'hono/method-not-allowed';
import { isEmpty, isString, } from '/contrib/jsm/kh_earlybird.js';
import { for_in, } from '/contrib/jsm/kh_functions.js';
import { Error, } from '/contrib/jsm/kh_classes.js';
import { use_handler_one as uho, use_handler_query as uhq, use_handler_validation as uhv, use_handler_headers as uhh, } from '/common/server_std_handler.mjs';
import { isAbsolute as pathIsAbsolute } from 'node:path';
// liefert den String nach dem n-ten Auftreten von search
function afterNthOccurence(s, search, n, incl = false) {
    return (incl ? search : '') + s.split(search).slice(n).join(search);
}
// Liefert die Position des n-ten Auftretens
function nthIndexOf(s, search, n) {
    // ''.split('/') => [ '' ]      '/'.split('/') => [ '', '' ]
    // Wir könnten die Rückgabe von split() auf n-Elemente limitieren, können dann jedoch nicht erkennen ob das zu findende Zeichen überhaupt enthalten istt.
    const s_splitted = s.split(search);
    if (n >= s_splitted.length)
        return -1;
    return s_splitted.slice(0, n).join(search).length;
}
export async function createApp(server_settings = cs.server_settings) {
    const app = new Hono({
        getPath: (req) => {
            const path = afterNthOccurence(req.url, '/', 3, true);
            return path.replace(/^(.+)\.((?:(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?:[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)|(?:\d{4}\.\d{1,2}\.\d{1,2}))\.(js|mjs|css|png|jpg|gif|json|html|htm)(\?.*)?$/, '$1.$3$4')
                .replaceAll(/[\/\\]((?:(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?:[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?))/g, '');
        }
    });
    const map = new Map();
    Object.defineProperty(app, 'set', {
        value: function (key, val) {
            map.set(key, val);
        }
    });
    app.use(async (c, next) => {
        // const req= Object.create(c.req) as typeof c.req;
        // const res= Object.create(c.res) as typeof c.res;
        c.req.res = c.res;
        // c.res.req= c.req;
        c.res.c = c;
        // basePath() und baseRoutePath() hier auszuwerten und für die Zuweisung an req-Properties zu nutzen ist selbstverständlich ein Denkfehler, weil sich diese Werte in Ab-
        // hängigkeit des aktuellen Handler ändern werden und hier leer sind, weil app.use() oben ohne Pfad aufgerufen wird.
        const originalUrl = new URL(c.req.url);
        let url = originalUrl.pathname; // auch bei express.js nur noch der Pfad
        Object.defineProperty(c.req, 'url', { get() { return url; }, set(nurl) { url = nurl; }, });
        Object.defineProperty(c.req, 'headers', { get() { return c.env.incoming.headers; }, });
        Object.defineProperty(c.req, 'get', { value: function (header_name) { return c.env.incoming.headers[header_name]; }, });
        Object.defineProperty(c.req, 'route', { get() { return ({ path: `${baseRoutePath(c)}${routePath(c)}` }); } });
        Object.defineProperty(c.req, 'socket', { get() { return c.env.incoming.socket; } });
        // Object.defineProperty(c.req, 'path',        { get() { return originalUrl.pathname; }, });
        Object.defineProperty(c.req, 'protocol', { get() { return originalUrl.protocol; }, });
        Object.defineProperty(c.req, 'secure', { get() { return 'https' == originalUrl.protocol; }, });
        Object.defineProperty(c.req, 'host', { get() { return this.get('host'); }, }); // wie bei express.js ausgehen ...
        Object.defineProperty(c.req, 'hostname', { get() { return this.get('host').split(':')?.[0]; }, }); // ... vom host-Header
        Object.defineProperty(c.req, 'params', { get() { return this.param(); }, });
        Object.defineProperty(c.req, '$query', { get() { return this.query(); }, });
        c.req.baseUrl = baseRoutePath(c) ?? ''; // Pfad eines übergeordneten Routers (ist hier leer; s. o.)
        c.req.originalUrl = url;
        for (const entry of map) {
            c.set(entry[0], entry[1]);
        }
        c.res.setHeader ??= function (key, val) { c.header(key, val); };
        c.res.header ??= c.res.setHeader;
        c.res.getHeader ??= function (key) { return c.res.headers.get(key); };
        c.res.removeHeader ??= function (key) { return c.res.headers.delete(key); };
        c.res.contentType ??= function (ct) {
            return c.res.setHeader('Content-Type', -1 === ct.indexOf('/') ? (mime.getType(ct) || 'application/octet-stream') : ct);
        };
        // unten gibt es auch noch setStatus()
        c.res.sendStatus ??= function (code) {
            c.status(code);
            c.env.outgoing.end();
            return RESPONSE_ALREADY_SENT;
        };
        c.res.sendFile = sendFile.bind(c.res);
        c.res.write ??= function (chunk, encoding, callback) {
            const res = c.body(chunk);
            if ('function' == typeof callback)
                callback(res);
            return res;
        };
        c.res.send ??= function (chunk, status = 200, headers) {
            return c.body(chunk, status, headers);
        };
        return await next();
    });
    app.use(methodNotAllowed({
        app,
        onMethodNotAllowed: (c, methods) => c.json({ error: 'Method Not Allowed' }, 405, { Allow: methods.join(', ') }),
    }));
    return app;
}
// *********************************************************************************************************************************************************************************
// Standard use-Handler
// *********************************************************************************************************************************************************************************
export function use_handler_one(app) {
    return app.use(async function (c, next) {
        // @ts-ignore   hier und nachfolgend ignore, um Compiler-Fehler bei Express-Backend zu vermeiden
        return uho(c.req, c.res, next);
    });
}
export function use_handler_validation(app) {
    return app.use('/', async function (c, next) {
        // @ts-ignore
        return uhv(c.req, c.res, next);
    });
}
export function use_handler_query(app) {
    return app.use(async function (c, next) {
        // @ts-ignore
        return uhq(c.req, c.res, next);
    });
}
export function use_handler_headers(app) {
    return app.use(async function (c, next) {
        // @ts-ignore
        return uhh(c.req, c.res, next);
    });
}
// *********************************************************************************************************************************************************************************
// Weiteres
// *********************************************************************************************************************************************************************************
export function sendJSON(res, o, status = 200) {
    return res.c.json(o, status); // res ist anschließend nicht mehr das selbe in c
}
export function setStatus(res, status) {
    return res.c.status(status);
}
export function redirect(res, path, status) {
    return res.c.redirect(path, status); // res ist anschließend nicht mehr das selbe in c
}
/*
// sendFile-Logik mit Web-Standards und Streams ohne automatisches Caching, Partial Content / Range Requests, ETags usw.
import { createReadStream, statSync, existsSync } from 'node:fs'
import { Readable } from 'node:stream'
import Mime from 'mime'

export function sendFile(c: Context, filePath: string, options?: { root?: string }) {
    const fullPath = options?.root ? `${options.root}/${filePath}` : filePath

    if (!existsSync(fullPath)) {
        return c.text('File Not Found', 404)
    }

    const stat = statSync(fullPath)
    if (!stat.isFile()) {
        return c.text('Forbidden', 403)
    }

    const mimeType = Mime.getType(fullPath) || 'application/octet-stream'
    const fileStream = createReadStream(fullPath)

    // Node.js ReadStream in einen Web-standard ReadableStream konvertieren
    const webStream = Readable.toWeb(fileStream) as ReadableStream

    return c.body(webStream, 200, {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
    })
}
*/
import send from 'send';
export async function sendFile(path, options = {}) {
    if (isEmpty(path))
        throw new TypeError('path argument is required to res.sendFile');
    if (!isString(path))
        throw new TypeError('path must be a string to res.sendFile');
    if (isEmpty(options.root) && !pathIsAbsolute(path))
        throw new TypeError('path must be absolute or specify root to res.sendFile');
    // create file stream
    path = encodeURI(path);
    return new Promise((resolve) => {
        // Zugriff auf native Node.js req / this Objekte aus Hono Bindings
        const req = this.c.env.incoming;
        const stream = send(req, path, options);
        // Falls ein Fehler auftritt (z. B. Datei nicht gefunden)
        stream.on('error', (err) => {
            const status = err.status || 500;
            resolve(this.c.text(err.message, status));
        });
        stream.on('end', () => {
            /*
            resolve(new Response(null, {
                status: (this as any).statusCode ?? 200,
            }));
            */
        });
        stream.on('directory', async () => {
            throw new Error({ msg: 'EISDIR, read', code: 'EISDIR' });
        });
        const othis = this;
        if (!isEmpty(options.headers)) {
            stream.on('headers', function (res) {
                kh_log.assert?.(res.equals(othis));
                for_in(options.headers, (k, v) => othis.setHeader(k, v));
            });
        }
        // Verbindet den Stream mit der Node.js ServerResponse
        stream.pipe(this.c.env.outgoing);
        // Wir signalisieren Hono, dass die Response bereits manuell gehandhabt wurde
        resolve(this.c.res);
    });
}
export function mountRouter(app, router) { return app.route('/', router); }
kh_global.LoadedScripts.get(mf).resolve(ms);
