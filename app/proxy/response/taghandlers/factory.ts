import { Tag } from "../../parser/tag";
import { Include } from "./esi/include";

import { Pipe } from "./pipe";
import { TagHandler } from "../../parser/taghandler";

export default function factory(tag: Tag): TagHandler {
    if (tag.prefix === 'esi') {
        if (tag.nodeName === 'include') {
            // TODO implement all the variations
            return new Include(tag);
        }
    }
    if (tag.prefix === 'pipe') {
        return new Pipe(tag);
    }
}