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


    public html(targetURL: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const { hostname, port, path } = url.parse(targetURL);
            const data: Buffer[] = [];
            const request = http.request({
                hostname,
                port,
                path,
            });
            request.setNoDelay(true);
            request.once('response', (res: http.IncomingMessage) => {

                res.on('data', (chunk) => {
                    data.push(chunk);
                });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(Buffer.concat(data).toString());
                    } else {
                        reject(new Error(`http error: ${res.statusCode}`));
                    }
                });
            });
            request.on('error', e => reject(e));
            request.end();
        });
    }

}

export default new Request();
