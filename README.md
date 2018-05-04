# gitbook-summary-generator

> This helps you to generate SUMMARY.md for gitbook with another style.

See `/example/book/SUMMARY.md`

## Install

- Install locally if you want to use it directly in yoru code

`npm i --save git+https://github.com/pillsilly/gitbook-summary-generator.git`

- Install gloabally if you want to use it in cli

`npm i --g git+https://github.com/pillsilly/gitbook-summary-generator.git`

## Usage

- Use it in js code

```javascript
const execute = require('gitbook-summary-generator').execute;
execute({ book: 'book', summary: 'book/SUMMARY.md' })
    .then(() => {
        console.log('finished')
    });
```

- Use it in command line

```bash
gitbook-summary-gen --book book --title titleGenByCLI
```
