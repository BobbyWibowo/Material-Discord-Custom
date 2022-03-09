const gulp = require('gulp')
const cssnano = require('cssnano')
const del = require('del')
const connect = require('gulp-connect')
const eslint = require('gulp-eslint7')
const postcss = require('gulp-postcss')
const postcssPresetEnv = require('postcss-preset-env')
const run = require('gulp-run')
const sass = require('gulp-dart-sass')
const sassCompiler = require('sass')
const sourcemaps = require('gulp-sourcemaps')
const stylelint = require('@ronilaukkarinen/gulp-stylelint')

// Put built files for development on a Git-ignored directory.
// This will prevent IDE's Git from unnecessarily
// building diff's during development.
const dist = process.env.NODE_ENV === 'development'
  ? './dist-dev'
  : './dist'

// BD_PLUGIN_PATH is an old alias, which was an incorrect decision since this is for a theme.
// Kept for compatibility.
const themePath = process.env.BD_THEME_PATH || process.env.BD_PLUGIN_PATH

const postcssPlugins = [
  postcssPresetEnv()
]

sass.compiler = sassCompiler

/** TASKS: LINT */

gulp.task('lint:src', () => {
  return gulp.src('./src/**/*.scss')
    .pipe(stylelint({
      failAfterError: true,
      reporters: [{ formatter: 'string', console: true }]
    }))
})

gulp.task('lint:themes', () => {
  return gulp.src('./themes/**/*.scss')
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
gulp.task('lint', gulp.parallel('lint:src', 'lint:themes', 'lint:js'))
gulp._settle = false

/** TASKS: CLEAN */

gulp.task('clean:src', () => {
  return del([
    `${dist}/src/**/*.css`,
    `${dist}/src/**/*.css.map`
  ])
})

gulp.task('clean:themes', () => {
  return del([
    `${dist}/themes/**/*.css`,
    `${dist}/themes/**/*.css.map`
  ])
})

gulp.task('clean:rest', () => {
  return del([
    `${dist}/*`
  ])
})

gulp.task('clean', gulp.parallel('clean:src', 'clean:themes', 'clean:rest'))

/** TASKS: BUILD */

gulp.task('build:src', function () {
  const _postcssPlugins = [...postcssPlugins]
  // Minify on production
  if (process.env.NODE_ENV !== 'development') {
    _postcssPlugins.push(cssnano())
  }
  return gulp.src('./src/**/*.scss', {
    ignore: '_*.scss'
  })
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(_postcssPlugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${dist}/src`))
})

gulp.task('build:themes', function () {
  return gulp.src('./themes/**/*.scss', {
    ignore: '_*.scss'
  })
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(postcssPlugins))
    .pipe(gulp.dest(`${dist}/themes`))
})

gulp.task('build', gulp.parallel('build:src', 'build:themes'))

gulp.task('default', gulp.series('lint', 'clean', 'build'))

/** TASKS: WATCH (SKIP LINTER) */

gulp.task('watch:src', () => {
  return gulp.watch('src/**/*.scss', gulp.series('clean:src', 'build:src'))
})

gulp.task('watch:themes', () => {
  return gulp.watch('themes/**/*.scss', gulp.series('clean:themes', 'build:themes'))
})

gulp.task('touch', () => {
  return run(`/usr/bin/touch "${themePath}"`).exec()
})

gulp.task('connect', () => {
  const root = process.env.NODE_ENV === 'development'
    ? 'dist-dev'
    : 'dist'
  connect.server({
    root,
    port: 10002,
    livereload: false
  }, () => {
    if (themePath) {
      (gulp.series('touch'))()
      gulp.watch(dist, gulp.series('touch'))
    }
  })
})

gulp.task('watch:all', gulp.parallel('watch:src', 'watch:themes'))

gulp.task('watch', gulp.series('clean', 'build', gulp.parallel('watch:all', 'connect')))
