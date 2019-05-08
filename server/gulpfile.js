var gulp = require('gulp');
var sass = require('gulp-sass');

var paths = {
	src: './app/assets/scss/**/*.scss',
	dest: './app/assets/css'
};

function style() {
	return gulp.src(paths.src)
		.pipe(sass(), sass.logError)
		.pipe(gulp.dest(paths.dest));
}

function watch() {
	gulp.watch(paths.src, style);
}

exports.build = gulp.series(style, watch);