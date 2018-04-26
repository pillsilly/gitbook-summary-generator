#!/usr/bin/env node
'use strict';

const program = require('commander');
const GitBookSummaryGenerator = require('./GitBookSummaryGenerator')

program.version('0.1.0')
    .option('--book [book]', '', process.cwd())
    .option('--summary [summary]', '', process.cwd() + '/SUMMARY.md')
    .option('--title [title]', '', 'Your Book Title')
    .parse(process.argv);

GitBookSummaryGenerator.newInstance(program);