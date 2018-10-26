import * as http from 'http';
import * as url from 'url';

// https://github.com/watson/flowhttp/blob/master/lib/request.js

export class Request {

    constructor() {
    }

    fetch(proxy: string, source: http.IncomingMessage): Promise<http.IncomingMessage> {

        // move this to a new method a static method somewhere like requests.parseHost
        
        const { hostname, port } = url.parse(proxy.startsWith('http://') ? proxy : `http://${proxy}`);

        return new Promise((resolve, reject) => {
            const uri = url.parse(source.url, true);
            const { method, headers } = source;
            const request = http.request({
                hostname,
                port,
                method,
                headers,
                path: uri.path,
                // add timeout!
            });
            request.setNoDelay(true);
            request.once('response', (res: http.IncomingMessage) => resolve(res));
            request.on('error', e => reject(e));
            request.end();
        });
    }
}

export default new Request();
