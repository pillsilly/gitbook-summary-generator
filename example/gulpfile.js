var gulp = require('gulp');
var execute = require('gitbook-summary-generator').execute;
gulp.task('default', function () {
    console.log('Hello world.');
});

var gulpGitbook = require('gulp-gitbook');
var del = require('del')

function clean(cb) {
    return del(['./book/_book']);
}

const build = function (done = () => { }) {
    return execute({ book: 'book', summary: 'book/SUMMARY.md' })
        .then(() => new Promise(resolve => gulpGitbook('book/', resolve)));
}

const serve = function (done) {
    gulpGitbook.serve('book', done);
}

const serve2 = function (a) {
    var express = require('express')
    var app = express()
    app.use(express.static('book'))
    const server = app.listen(3000);

    const stream = gulp.watch('book/**/*.md', { ignored: 'book/_book/*' }).on('change', function (path, stats) {
        console.log('File ' + path + ' was changed');
        stream.close();
        server.close();
        clean()
            .then(build)
            .then(() => {
                setTimeout(serve2, 3000);
            });
    });
}
exports.clean = clean;
exports.build = build;
exports.serve = serve;
exports.serve2 = serve2;
gulp.task('serve2', serve2);
gulp.task('serve', serve);


const run = gulp.series(clean, build, serve2);

gulp.task('run', run);
gulp.task('build', build);