import { Handler } from "./handler";

export class Pipe extends Handler {
    html() {
        return `<!-- ${this.tag.name}  -->`;
    }

    beforeend() {
        return Promise.resolve('<!-- pipe end -->');
    }
}