import { Handler } from "./handler";
import { Tag } from "../../parser/tag";

import * as crypto from 'crypto';


export class Pipe extends Handler {

    private id: string;
    constructor(tag: Tag) {
        super(tag);
        this.id = `pipe-${crypto.randomBytes(20).toString('hex')}`;
    }

    html() {
        return `<div id="${this.id}" class="pipe"></div>`;
    }

    beforeend() {
        return Promise.resolve(`<script>/**init ${this.id}*/</script>`);
    }
}