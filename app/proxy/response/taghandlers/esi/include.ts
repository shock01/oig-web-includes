import { Handler } from "../handler";
import request from "../../../http/request";
// we need to make the request and also preserve the cache headers from the response
/**
 * <esi:include src="http://example.com/1.html" alt="http://bak.example.com/2.html" onerror="continue"/>
 * 
 * can we use async/await here? its not called in async context
 * 
 */
export class Include extends Handler {

    html(): Promise<string> {

        const { src, alt, onerror } = this.tag.attributes;
        return new Promise((resolve, reject) => {
            request.html(src)
                .catch((e: Error): Promise<string> | string => {
                    if (alt) {
                        return request.html(alt);
                    }
                    if (onerror === 'continue') {
                        // should silently fail
                        return '';
                    } else {
                        reject(e);
                    }
                })
                .then(resolve);
        });
    }
}