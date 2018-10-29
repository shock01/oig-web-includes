import { Writable, Readable } from "stream";

import { BufferStream } from '../../streams';
import { Tag, parseTag } from "./tag";
import { TagHandler } from "./taghandler";

export interface TagCallback {
    (tag: Tag, response: ProxyParser): TagHandler;
}

const regexTag = /<((?:pipe|esi)\:[a-z]+)\b([^>]+[^\/>])?(?:\/|>([\s\S]*?)<\/\1)>/i;
export default class ProxyParser extends Writable {

    private bufferStream: BufferStream;
    private pendingBuffers: Buffer[] = [];
    private html: Promise<string>[] = [];
    private beforeend: (Promise<string> | string)[] = [];
    private pending: number = 0;
    constructor(
        private tagCallback: TagCallback,
        private source: Readable,
        private target: Writable) {
        super();
        this.bufferStream = new BufferStream();
    }

    process() {
        this.source.pipe(this);
        this.bufferStream.pipe(this.target);
        this.bufferStream.once('end', () => this.dispose());
        return new Promise((resolve, reject) => {
            this.source.once('end', () => {
                Promise.all(this.html)
                    .then(() => this.bufferStream.end())
                    .then(() => resolve());
            });
            this.source.once('error', (e) => reject(e));
            this.target.once('error', (e) => reject(e));
            this.bufferStream.once('error', (e) => reject(e));
        });
    }

    get buffer() {
        return this.bufferStream.buffer;
    }

    _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {

        const buffer = Buffer.from(chunk, encoding);
        const ii = buffer.length;
        const buffers: Buffer[] = [];

        let i = 0, j = 0, value;

        do {
            value = buffer.slice(j, i).toString();
            const matches = regexTag.exec(value);
            if (matches) {
                const [, tag, attributes, textContent] = matches;
                buffers.push(Buffer.from((<any>RegExp).leftContext));
                let tagHandler = this.handleTag(parseTag(tag, attributes, textContent));
                let html = tagHandler.html();
                let beforeend = tagHandler.beforeend();
                if (typeof html === 'string') {
                    buffers.push(Buffer.from(html));
                } else {
                    // content is not ready yet so we are pushing a null value
                    this.html.push(html);
                    // we actually know the index to write to.....
                    buffers.push(null);
                    this.handleHtml(html, buffers.length - 1);
                }
                if (beforeend !== null) {
                    this.beforeend.push(beforeend);
                }
                j = i;
            } else if (value.indexOf('</body>') > -1) {
                buffers.push(null);
                let html = this.handleBeforeEnd(value);
                this.html.push(html);
                this.handleHtml(html, buffers.length - 1);
                j = i;
            }
        } while (i++ < ii)
        // finish the last part 
        if (j < ii) {
            buffers.push(buffer.slice(j));
        }

        const firstPendingNull = this.pendingBuffers.indexOf(null);
        const firstNull = buffers.indexOf(null);

        if (firstPendingNull > -1 || firstNull > -1) {
            if (!this.pendingBuffers.length) {
                // nothing pending write until we encounter a null
                this.bufferStream.write(Buffer.concat(buffers.slice(0, firstNull)), callback);
            }
            this.pendingBuffers = this.pendingBuffers.concat(buffers);
        } else {
            this.bufferStream.write(Buffer.concat(buffers), callback);
        }
    }

    private handleBeforeEnd(html: string) {
        if (!this.beforeend.length) {
            return Promise.resolve(html);
        }
        return Promise.all(this.beforeend)
            .then((value: string[]) => value.reduce((a: string, b: string) => a + b))
            .then(value => value + html);
    }

    private dispose() {
        this.source.unpipe(this);
        this.bufferStream.unpipe(this.target);
        this.html = [];
        this.pendingBuffers = [];
    }

    handleTag(tag: Tag): TagHandler {
        return this.tagCallback(tag, this);
    }

    handleHtml(promise: Promise<string>, index: number) {
        promise.then((value) => {
            this.providePending(value, index);
            this.flushPending();
        });
    }

    private providePending(value: string, index: number) {
        this.pendingBuffers[index] = Buffer.from(value);
    }

    private flushPending() {

        const nextPendingNull = this.pendingBuffers.indexOf(null);

        let result: Buffer;

        if (nextPendingNull === -1) {
            // nothing pending flush them all
            result = Buffer.concat(this.pendingBuffers.splice(this.pending));
            this.pending = 0;
        } else {
            result = Buffer.concat(this.pendingBuffers.slice(this.pending, nextPendingNull));
            this.pending = nextPendingNull;
        }
        this.bufferStream.write(result);
    }


}