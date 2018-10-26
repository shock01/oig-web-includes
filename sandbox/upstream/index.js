const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const serveStatic = require('serve-static');

app.use(serveStatic(path.join(__dirname, 'public'), {
    'index': ['index.html'],
    maxAge: '1m',
}));

app.listen(port, () => console.log(`sanbox app listening on port ${port}!`))