#!/usr/bin/env node
'use strict';

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
    .parse(process.argv);

const BOOK_DIR = unifySep(path.resolve(program.book));
console.log(`Book dir is: ${BOOK_DIR}`);
function clean(cb) {
    return del([`${BOOK_DIR}/_book`]);
}

function build() {
    return buildSummary().then(buildBook);
}

function buildBook() {
    return new Promise(resolve => gulpGitbook(BOOK_DIR, resolve));
}

function buildSummary() {
    return execute({ book: BOOK_DIR, summary: `SUMMARY.md`, title: program.title });
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

clean().then(build)
    .then(serve);