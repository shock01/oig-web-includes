import { Tag } from "../../parser/tag";
import { TagHandler } from "../../parser/taghandler";

export abstract class Handler implements TagHandler {

    constructor(protected tag: Tag) {

    }

    /**
     * handle will return the initial result that will be written to the client 
     * when a matching tag is encountered
     */
    abstract html(): Promise<string> | string;

    /**
     * do we need a finalize method here ? for the body close part?
     */

    beforeend(): Promise<string> | string {
        return null;
    }
    
}