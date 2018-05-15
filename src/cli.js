#!/usr/bin/env node
'use strict';
const fs = require('fs');
const program = require('commander');
const GitBookSummaryGenerator = require('./GitBookSummaryGenerator');
const { execute, unifySep } = GitBookSummaryGenerator
const gulp = require('gulp');
const gulpGitbook = require('gulp-gitbook');
const del = require('del')
const path = require('path')
program.version('0.1.0')
    .option('--book [book]', '', process.cwd())
    .option('--summary [summary]', '', process.cwd() + '/SUMMARY.md')
    .option('--title [title]', '', 'Your Book Title')
    .option('--serve [serve]', '', true)
    .option('--exclude [exclude]', '', '')
    .parse(process.argv);

let exclude = program.exclude;
const BOOK_DIR = unifySep(path.resolve(program.book));
console.log(`Book dir is: ${BOOK_DIR}`);
function clean(cb) {
    return del([`${BOOK_DIR}/_book`]);
}

function build() {
    return buildSummary().then(buildBook);
}

function buildBook() {
    return new Promise(resolve => {
        checkReadMeFile();
        gulpGitbook(BOOK_DIR, resolve);
    });
}

function buildSummary() {
    console.log(`exclude is: ${exclude}`);
    exclude = exclude.split(',') || [];
    return execute({ book: BOOK_DIR, summary: `SUMMARY.md`, title: program.title, exclude });
}

function checkReadMeFile() {
    const README_PATH = `${BOOK_DIR}/README.md`;
    if (!fs.existsSync(README_PATH))
        fs.writeFileSync(README_PATH, '# Default README')
}

function serve() {
    const express = require('express')
    const app = express()
    app.use(express.static(`${BOOK_DIR}`))
    const server = app.listen(3000);
    console.log(`Watching on: ${BOOK_DIR}/**/*.md`);
    const stream = gulp.watch(`${BOOK_DIR}/**/*.md`, { ignored: `${BOOK_DIR}/_book/*` }).on('change', function (path, stats) {
        console.info('File ' + path + ' was changed');
        stream.close();
        console.info('stream closed');
        server.close();
        console.info('server closed');
        clean()
            .then(build)
            .then(serve);
    });
}

if (program.serve)
    clean().then(build)
        .then(serve);
else
    clean().then(build);