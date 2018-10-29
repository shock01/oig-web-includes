import { Tag } from "../../parser/tag";
import { ESI } from "./esi";

import { Pipe } from "./pipe";
import { TagHandler } from "../../parser/taghandler";

export default function factory(tag: Tag): TagHandler {
    if (tag.prefix === 'esi') {
        // TODO implement all the variations
        return new ESI(tag);
    }
    if (tag.prefix === 'pipe') {
        return new Pipe(tag);
    }
}