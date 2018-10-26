
import { PassThrough, TransformOptions } from 'stream';

export interface BufferStreamCallback {
    (err: Error | null, buffer: Buffer): void;
}


export default class BufferStream extends PassThrough {

    private buffers: Buffer[];
    constructor(opts?: TransformOptions) {
        super(opts);
        this.buffers = [];
    }

    _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
        super._write(chunk, encoding, callback);
        this.buffers.push(Buffer.from(chunk));
    }

    get buffer() {
        return Buffer.concat(this.buffers);
    }

    dispose() {
        this.buffers = null;
    }
}