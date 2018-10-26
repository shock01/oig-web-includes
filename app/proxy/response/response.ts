import * as http from 'http';
import { Request } from '../http/request';

export interface Handler {
    handle(): Promise<void>;
}


const PROXY_HEADER = 'x-webincludes-proxy';
const DEFAULT_PROXY = process.env.NODE_ENV === 'production' ? null : 'localhost:3000';

export abstract class Response implements Handler {
    constructor(protected req: http.IncomingMessage,
        protected res: http.ServerResponse,
        protected proxy: Request) {
    }

    abstract handle(): Promise<void>;

    public async message() {
        const { proxy, req } = this;
        const proxyHeader = this.req.headers[PROXY_HEADER] as string || DEFAULT_PROXY;
        const message = await proxy.fetch(proxyHeader, req);
        return message;
    }
}