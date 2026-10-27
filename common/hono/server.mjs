// coding: utf-8
import { initContext, kh_global, } from '/contrib/jsm/kh_module_context.js';
const cf = 'kh_server'; // context flag
const mf = 'common_hono_server_esm'; // module flag
const { cs, ms } = initContext(cf, mf);
import { serve, } from '@hono/node-server';
import * as mergePatch from 'json8-merge-patch';
import { createServer as http_createServer } from 'node:http';
import { createServer as https_createServer } from 'node:https';
import { isPaaS, } from '/contrib/jsm/kh_earlybird.js';
export function createServer(app, server_settings = cs.server_settings, sub_opt, onlisten) {
    server_settings = mergePatch.apply(server_settings, sub_opt);
    const use_ssl = !isPaaS() && true !== server_settings['force-unsafe'];
    return serve({ serverOptions: server_settings,
        fetch: app.fetch,
        createServer: use_ssl ? https_createServer : http_createServer,
        port: server_settings.port
    }, onlisten);
}
kh_global.LoadedScripts.get(mf).resolve(ms);
