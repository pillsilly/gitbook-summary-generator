var gulp = require('gulp');
var execute = require('./src/GitBookSummaryGenerator').execute;
gulp.task('default', function () {
    console.log('Hello world.');
});

var gulpGitbook = require('gulp-gitbook');
var del = require('del')

function clean(cb) {
    return del(['./example/_book']);
}

const build = function (done = () => { }) {
    return execute({ book: 'example', summary: 'example/SUMMARY.md' })
        .then(() => new Promise(resolve => gulpGitbook('example/', resolve)));
}

const serve = function (done) {
    gulpGitbook.serve('example', done);
}

const serve2 = function (a) {
    var express = require('express')
    var app = express()
    app.use(express.static('example'))
    const server = app.listen(3000);

    const stream = gulp.watch('example/**/*.md', { ignored: 'example/_book/*' }).on('change', function (path, stats) {
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