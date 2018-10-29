import { Handler } from "./response";
import ProxyParser from "../parser";
import { PassThroughResponse } from ".";
import * as http from 'http';
import { Tag } from "../parser/tag";
import factory from "./taghandlers/factory";
import { TagHandler } from "../parser/taghandler";

export default class IncludesResponse implements Handler {

    constructor(
        private req: http.IncomingMessage,
        private res: http.ServerResponse,
        private passthrough: PassThroughResponse) {
    }
    async handle(): Promise<void> {
        if (!this.eligableRequest(this.req)) {
            return this.passthrough.handle();
        }
        const message = this.patchMessage(await this.passthrough.message());
        if (!this.eligableResponse(message)) {
            return this.passthrough.handle();
        }
        await this.parse(message);
    }

    private headers(headers: http.IncomingHttpHeaders): http.IncomingHttpHeaders {
        const result = Object.assign({}, headers);
        delete result['content-length'];
        delete result['set-cookie'];
        return result;
    }

    private async parse(message: http.IncomingMessage) {
        const headers = this.headers(message.headers);
        const { res } = this;
        res.writeHead(message.statusCode, headers);
        res.flushHeaders();
        try {
            const parser = new ProxyParser((tag) => this.tagCallback(tag), message, res);
            await parser.process();
        } catch (e) {
            res.writeHead(500, e.message);
            res.write(e.stack || e.message);
            res.end();
        }
    }

    /**
     * express does not always set content-type header
     * @param res 
     */
    private patchMessage(res: http.IncomingMessage): http.IncomingMessage {
        if (!res.headers["content-type"]) {
            res.headers["content-type"] = 'text/html';
        }
        return res;
    }

    private eligableResponse(res: http.IncomingMessage) {
        if (!res.headers["content-type"].startsWith('text/html')) {
            return false;
        }
        return true;
    }

    private eligableRequest(req: http.IncomingMessage) {
        if (req.method !== 'GET') {
            return false;
        }
        return true;
    }

    private tagCallback(tag: Tag): TagHandler {
        return factory(tag);
    }
}