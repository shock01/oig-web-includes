import { Writable, Readable } from "stream";

import { BufferStream } from '../../streams';
import { Tag, parseTag } from "../response/tag";

export interface TagHandler {
    (tag: Tag, response: ProxyParser): Promise<string> | string;
}

const regexTag = /<((?:pipe|esi)\:[a-z]+)\b([^>]+[^\/>])?(?:\/|>([\s\S]*?)<\/\1)>/i;
export default class ProxyParser extends Writable {

    private bufferStream: BufferStream;
    private pendingBuffers: Buffer[] = [];
    private pending: number = 0;
    private promises: Promise<String>[] = [];

    constructor(
        private tagHandler: TagHandler,
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
                Promise.all(this.promises)
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
                let result = this.handleTag(parseTag(tag, attributes, textContent));
                if (typeof result === 'string') {
                    buffers.push(Buffer.from(result));
                } else {
                    // content is not ready yet so we are pushing a null value
                    this.promises.push(result);
                    // we actually know the index to write to.....
                    buffers.push(null);
                    this.handlePromise(result, buffers.length - 1);
                }
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

    private dispose() {
        this.source.unpipe(this);
        this.bufferStream.unpipe(this.target);
        this.promises = [];
        this.pendingBuffers = [];
    }

    handleTag(tag: Tag): Promise<string> | string {
        return this.tagHandler(tag, this);
    }

    handlePromise(promise: Promise<string>, index: number) {
        promise.then((value) => {
            this.providePending(promise, value, index);
            this.flushPending();
        });
    }

    private providePending(promise: Promise<string>, value: string, index: number) {
        this.pendingBuffers[index] = Buffer.from(value);
    }

    private flushPending() {
        const nextPendingNull = this.pendingBuffers.indexOf(null);
        let result: Buffer;
        // we will write till the nextNull and starting from this.pending
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