var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function () {
    return gulp.src('./app/assets/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./app/assets/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./app/assets/scss/**/*.scss', ['sass']);
});