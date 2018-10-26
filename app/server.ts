
import proxy from './proxy';
proxy();


process.on('warning', e => console.warn(e.stack));



