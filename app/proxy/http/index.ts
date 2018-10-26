import * as http from 'http';
import request from './request';

import { IncludesResponse, PassThroughResponse } from '../response';

export function handler(options = {}) {
    return async (req: http.IncomingMessage, res: http.ServerResponse) => {
        const includes = new IncludesResponse(req, res, new PassThroughResponse(req, res, request));
        await includes.handle();
    };
}