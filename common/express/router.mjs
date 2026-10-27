// coding: utf-8
import { initContext, kh_global, } from '/contrib/jsm/kh_module_context.js';
const cf = 'kh_server'; // context flag
const mf = 'common_express_router_esm'; // module flag
const { cs, ms } = initContext(cf, mf);
import { isEmpty, } from '/contrib/jsm/kh_earlybird.js';
import { Error, } from '/contrib/jsm/kh_classes.js';
import { cloneObject, } from '/contrib/jsm/kh_functions.js';
import { Router as BackendRouter, } from 'express';
export { BackendRouter };
// *********************************************************************************************************************************************************************************
// Klasse Router
// *********************************************************************************************************************************************************************************
// Wir können nicht ohne weitere von express.Router ableiten, da dieser den eigenen Prototyp manipuliert und deshalb this anschließend nicht den Prototyp der Klasse besitzt.
// Ab Express Version 5 soll es möglich sein.
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
        // const r1= Router.prototype;                              const r11= Object.getPrototypeOf(Router);  const r111= Object.getPrototypeOf(this);
        // const r2= r1?.__proto__;                                 const r22= Object.getPrototypeOf(r11);
        // const r3= Object.getPrototypeOf(this.constructor);
        // Notwendige Prototyp Verbiegung bei express< 5
        /*
                const proto= Object.getPrototypeOf(this);                   // aktuelle Basistyp => etwas von express.Router manipuliertes
                Object.setPrototypeOf(this, Router.prototype);              // setze den Typ von this
                Object.setPrototypeOf(Object.getPrototypeOf(this), proto);  // setze den Typ des Basistyps
        */
        if (base instanceof Router) {
            base.addChild(this);
            this.base_router_ = base;
        }
        // Haben keinen besseren Test für Application Object, fängt auch Basisklassen-Router Instanzen ab. Es ist besser die Basisklassen-Router an dieser Stelle zu handeln, da
        // diese keine Methode wie fullRoute() oder childs() bieten.
        else if (Function.isFunction(base?.use)) {
            // const ty= getTypeName(base); // <-- function
            this.base_ = base;
        }
        if (!isEmpty(own_route) && !own_route.startsWith('/'))
            own_route = '/' + own_route;
        this.own_route_ = own_route;
        if (call_use && !isEmpty(this.ownRoute)) {
            let routes = [];
            if (filter)
                routes.push(filter); // evtl. wurde ein zusätzlicher pre-Filter übergeben
            routes.push(this);
            (this.baseRouter ?? this.base)?.use(this.ownRoute, routes);
        }
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
export function getBasicRouter() { return BackendRouter(); }
export function ènext(next, error) { return next(error); } // Fehlerhandling
export function ƒnext(next) { return next(); } // next ausführen
export function route(router, method = 'GET', route, handlers) {
    const _method = method.toLowerCase();
    if (isEmpty(route))
        throw new Error('param-invalid', 'route'); // sollte undefined und leere Arrays abfangen können
    if (isEmpty(handlers))
        throw new Error('param-invalid', 'handler'); // dito
    if (!Array.isArray(handlers))
        handlers = [handlers];
    return router[_method](route, handlers);
}
kh_global.LoadedScripts.get(mf).resolve(ms);
