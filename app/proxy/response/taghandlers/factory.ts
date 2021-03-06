import { Tag } from "../../parser/tag";
import { Include } from "./esi/include";

import { Pipe } from "./pipe";
import { TagHandler } from "../../parser/taghandler";
import { Remove } from "./esi/remove";
import { Comment } from "./esi/comment";
export default function factory(tag: Tag): TagHandler {
    if (tag.prefix === 'esi') {
        if (tag.nodeName === 'include') {
            // TODO implement all the variations
            return new Include(tag);
        } else if (tag.nodeName === 'remove') {
            return new Remove(tag);
        } else if (tag.nodeName === 'comment') {
            return new Comment(tag);
        }
    }
    if (tag.prefix === 'pipe') {
        return new Pipe(tag);
    }
}