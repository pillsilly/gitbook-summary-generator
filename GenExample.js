//This file shows how to call from node js application
GitBookSummaryGenerator = require('./src/GitBookSummaryGenerator');
GitBookSummaryGenerator.newInstance({ book: './example', summary: './example/SUMMARY.md' });