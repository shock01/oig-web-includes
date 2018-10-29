import { Handler } from "./handler";

export class ESI extends Handler {

    html(): Promise<string> {
        return new Promise<string>((resolve) => {
            setTimeout(() => resolve(`<div>INCLUDED: <!-- ${this.tag.name} --></div>`), 1000);
        });
    }
}