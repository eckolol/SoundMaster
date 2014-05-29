var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    jshint = require('gulp-jshint'),
    open = require('gulp-open'),
    bower = require('gulp-bower'),
    stylish = require('jshint-stylish');


gulp.task('lint', function () {
  gulp.src(['app.js','public/js/*.js'],{base: '.'})
  	.pipe(jshint())
    .pipe(jshint.reporter(stylish));
})

gulp.task('dev', function () {
  //Install dependencies
  bower();
  var options = {
    url: 'http://localhost:1337'
  };
  gulp.src('./public/index.html')
    .pipe(open('', options));

  nodemon({
      script: 'app.js',
      ext: 'html js',
      ignore: ['node_modules/**'],
      env: { 'NODE_ENV': 'development' }
    })
    .on('change', ['lint'])
    .on('restart', function () {
      console.log('restarted!')
    })
})
