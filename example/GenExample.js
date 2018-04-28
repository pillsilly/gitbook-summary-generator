//This file shows how to call from node js application
const execute = require('gitbook-summary-generator').execute;
execute({ book: 'example', summary: 'example/SUMMARY.md' }).then(() => {
    console.log('finished')
});