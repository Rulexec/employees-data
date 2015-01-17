var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');

var paths = {
  vendorScripts: ['angular-ui-slider/src/slider.js'].map(function(x) { return 'bower_components/' + x; }),
};

gulp.task('clean', function(cb) {
  del(['lib'], cb);
});

gulp.task('vendorScripts', ['clean'], function() {
  return gulp.src(paths.vendorScripts)
    .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(concat('vendors.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('lib'));
});

gulp.task('default', ['vendorScripts']);
