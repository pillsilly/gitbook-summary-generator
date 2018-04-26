var gulp = require('gulp');

gulp.task('default', function () {
    console.log('Hello world.');
});

var gulpGitbook = require('gulp-gitbook');
var del = require('del')

function clean(cb) {
    return del(['./example/_book']);
}

const build = function (a) {
    gulpGitbook('./example/', a);
}

const serve = function (a) {
    gulpGitbook.serve('./example/', a);
}
exports.clean = clean;
exports.build = build;
exports.serve = serve;

const run = gulp.series(clean, build, serve);

gulp.task('run', run);