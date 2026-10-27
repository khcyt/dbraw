// coding: utf-8
import { initContext, kh_global, } from '/contrib/jsm/kh_module_context.js';
const cf = 'kh_server'; // context flag
const mf = 'common_hono_router_esm'; // module flag
const { cs, ms } = initContext(cf, mf);
import { isEmpty, } from '/contrib/jsm/kh_earlybird.js';
import { Error, } from '/contrib/jsm/kh_classes.js';
import { cloneObject, } from '/contrib/jsm/kh_functions.js';
import { Hono as BackendRouter, } from 'hono';
export { BackendRouter, }; // wird bei express benötigt. Wir exportieren hier aus Kompatibilitätsgründen.
// *********************************************************************************************************************************************************************************
// Klasse Router
// *********************************************************************************************************************************************************************************
export class Router extends BackendRouter {
    base_;
    base_router_;
    own_route_;
    child_router_ = [];
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // private Klassenelemente funktionieren nicht, solange wir den Prototyp von this manipulieren!
    // #base_;                 // gültig, wenn Basisrouter vom Typ express router function
    // #base_router_;          // gültig, wenn Basisrouter vom Typ Router
    // child_router_= [];     // 0..n child router
    // #own_route_;            // die eigene Route
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    constructor(base, own_route, options = {}) {
        options = cloneObject(options);
        const call_use = options.call_use;
        delete options.call_use; // this und evtl. Filter beim Basisrouter eintragen
        base = base ?? options.base;
        delete options.base;
        const filter = options.filter;
        delete options.filter;
        super(options);
        if (base instanceof Router) {
            base.addChild(this);
            this.base_router_ = base;
        }
        else if (base instanceof BackendRouter) {
            this.base_ = base;
        }
        if (!isEmpty(own_route) && !own_route.startsWith('/'))
            own_route = '/' + own_route;
        this.own_route_ = own_route;
        // An dieser Stelle hat das Routing meist keine Auswirkungen, weil nur bereits existierende Routen gehandelt werden. Auf zukünftig hinzugefügte hat es keine Auswirkung.
        if (call_use && !isEmpty(this.ownRoute)) {
            let routes = [];
            if (filter)
                routes.push(filter); // evtl. wurde ein zusätzlicher pre-Filter übergeben
            routes.push(this);
            routes.forEach(route => (this.baseRouter ?? this.base)?.route(this.ownRoute, route));
        }
        Object.defineProperty(this, 'use2nd', { value: function () {
                if (call_use && !isEmpty(this.ownRoute)) {
                    let routes = [];
                    if (filter)
                        routes.push(filter); // evtl. wurde ein zusätzlicher pre-Filter übergeben
                    routes.push(this);
                    routes.forEach(route => (this.baseRouter ?? this.base)?.route(this.ownRoute, route));
                }
            }
        });
    }
    addChild(sub_router) {
        if (sub_router instanceof Router)
            this.childs.push(sub_router);
    }
    fullRoute() { return `${this.baseRouter?.fullRoute() ?? ''}${this.ownRoute ?? '/???'}`; }
    get root() { return this.base_router_?.root ?? this; }
    get base() { return this.base_; } // eher Funktion als Router-Objekt          i. a. liefert nur eines
    get baseRouter() { return this.base_router_; } // Router-Objekt                            von beiden einen gültig Wert
    get ownRoute() { return this.own_route_; }
    get rootRoute() { return this.root.ownRoute; }
    get childs() { return this.child_router_; }
}
export function getBasicRouter() { return new BackendRouter(); }
export async function ènext(next, error) { throw error; }
export async function ƒnext(next) { return await next(); }
export function route(router, method = 'GET', route, handlers) {
    const _method = method.toLowerCase();
    if (isEmpty(route))
        throw new Error('param-invalid', 'route'); // sollte undefined und leere Arrays abfangen können
    if (isEmpty(handlers))
        throw new Error('param-invalid', 'handler'); // dito
    if (!Array.isArray(handlers))
        handlers = [handlers];
    const mapped_handlers = handlers.map(handler => (c, next) => handler(c.req, c.res, next));
    if (Array.isArray(route))
        router.on(method, route, ...mapped_handlers);
    else {
        mapped_handlers.forEach(mh => router[_method](route, mh));
        router;
    }
    if (router instanceof Router)
        router.use2nd();
}
kh_global.LoadedScripts.get(mf).resolve(ms);
