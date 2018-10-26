import * as http from 'http';
import {handler} from './http';

export default function proxy() {
    const PORT = process.env.PORT || 8000;
    const server = http.createServer(handler());
    server.listen(PORT, () => console.log(`server is listening on port: ${PORT}`));
}