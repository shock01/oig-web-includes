
const reg_attrs = /\b([^\s=]+)(=(('|")(.*?[^\\]|)\4|[^\s]+))?/ig

function parseAttributes(str: string) {

    var m, r: { [key: string]: string } = {};
    while ((m = reg_attrs.exec(str))) {
        if (m[1] === undefined) {
            continue;
        }
        r[m[1]] = (m[5] !== undefined ? m[5] : m[3]);
    }

    return r;
}

export interface Tag {
    name: string;
    nodeName: string;
    prefix?: string;
    textContent?: string;
    attributes?: { [key: string]: string }
}

export function parseTag(name: string, attributes: string, textContent: string): Tag {
    let [prefix, nodeName] = name.split(':');
    return { name, prefix, nodeName, textContent, attributes: parseAttributes(attributes) };
}