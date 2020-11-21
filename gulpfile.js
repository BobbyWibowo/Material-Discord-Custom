const gulp = require('gulp')
const cssnano = require('cssnano')
const del = require('del')
const Fiber = require('fibers')
const eslint = require('gulp-eslint7')
const postcss = require('gulp-postcss')
const postcssPresetEnv = require('postcss-preset-env')
const sass = require('gulp-dart-sass')
const sassCompiler = require('sass')
const sourcemaps = require('gulp-sourcemaps')
const stylelint = require('gulp-stylelint')

// Put built files for development on a Git-ignored directory.
// This will prevent IDE's Git from unnecessarily
// building diff's during development.
const dist = process.env.NODE_ENV === 'development'
  ? './dist-dev'
  : './dist'

const postcssPlugins = [
  postcssPresetEnv()
]

sass.compiler = sassCompiler

// Minify on production
if (process.env.NODE_ENV !== 'development') {
  postcssPlugins.push(cssnano())
}

/** TASKS: LINT */

gulp.task('lint:sass', () => {
  return gulp.src('./src/**/*.scss')
    .pipe(stylelint({
      failAfterError: true,
      reporters: [{ formatter: 'string', console: true }]
    }))
})

gulp.task('lint:js', () => {
  return gulp.src('./*.js')
    .pipe(eslint())
    .pipe(eslint.format('stylish'))
    .pipe(eslint.failAfterError())
})

// Set _settle to true, so that if one of the parallel tasks fails,
// the other one won't exit prematurely (this is a bit awkward).
// https://github.com/gulpjs/gulp/issues/1487#issuecomment-466621047
gulp._settle = true
gulp.task('lint', gulp.parallel('lint:sass', 'lint:js'))
gulp._settle = false

/** TASKS: CLEAN */

gulp.task('clean:css', () => {
  return del([
    `${dist}/**/*.css`,
    `${dist}/**/*.css.map`
  ])
})

gulp.task('clean:rest', () => {
  return del([
    `${dist}/*`
  ])
})

gulp.task('clean', gulp.parallel('clean:css', 'clean:rest'))

/** TASKS: BUILD */

gulp.task('build:sass', function () {
  return gulp.src('./src/**/*.scss', {
    ignore: '_*.scss'
  })
    .pipe(sourcemaps.init())
    .pipe(sass({ fiber: Fiber }).on('error', sass.logError))
    .pipe(postcss(postcssPlugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist))
})

gulp.task('build', gulp.parallel('build:sass'))

/** TASKS: VERSION STRINGS */

/*
gulp.task('exec:bump-versions', cb => {
  exec('node ./scripts/bump-versions.js 1', (error, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout)
    if (stderr) process.stderr.write(stderr)
    cb(error)
  })
})
*/

gulp.task('default', gulp.series('lint', 'clean', 'build'/*, 'exec:bump-versions' */))

/** TASKS: WATCH (SKIP LINTER) */

gulp.task('watch:css', () => {
  return gulp.watch('src/**/*.scss', gulp.series('clean:css', 'build:sass'))
})

gulp.task('watch:src', gulp.parallel('watch:css'))

gulp.task('watch', gulp.series('clean', 'build', gulp.parallel('watch:src')))
