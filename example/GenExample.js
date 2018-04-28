//here it shows how it can be used directly in nodejs
const execute = require('gitbook-summary-generator').execute;
execute({ book: 'book', summary: 'book/SUMMARY.md' })
    .then(() => {
        console.log('finished')
    });