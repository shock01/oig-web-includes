
import { Response } from './response';

export default class PassThroughResponse extends Response {

    async handle() {
        const { res } = this
        try {
            const message = await this.message();
            res.writeHead(message.statusCode, message.headers);
            res.flushHeaders();
            message.pipe(res);
        } catch (e) {
            res.writeHead(500, e.message);
            res.write(e.stack || e.message);
            res.end();
        }
    }

}