// here it shows how it can be use in gulp.
const gulp = require('gulp');
const execute = require('gitbook-summary-generator').execute;
const gulpGitbook = require('gulp-gitbook');
const del = require('del')

const BOOK_DIR = 'book';

function clean(cb) {
    return del([`./${BOOK_DIR}/_book`]);
}

function build() {
    return execute({ book: BOOK_DIR, summary: `${BOOK_DIR}/SUMMARY.md` })
        .then(() => new Promise(resolve => gulpGitbook(`${BOOK_DIR}/`, resolve)));
}

function serve(done = () => { }) {
    const express = require('express')
    const app = express()
    app.use(express.static(`${BOOK_DIR}`))
    const server = app.listen(3000);
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
    done();
}

gulp.task('default', function (done) {
    console.log('Gulp CLI works');
    done();
});
gulp.task('build', build);
gulp.task('serve', serve);
gulp.task('run', gulp.series(clean, build, serve));
