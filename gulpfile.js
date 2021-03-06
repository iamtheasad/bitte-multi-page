// Initialize Modules
const gulp = require("gulp");
const { src, dest, watch, series, parallel } = require("gulp");

// Importing all gulp files
const clean = require("gulp-clean"); // Remove file
const browserSync = require("browser-sync").create(); // Automatically create server, watch files and reload on browser
const autoprefixer = require("autoprefixer"); // Browser Support Ad
const cssnano = require("cssnano"); // Optimize or minifiy css which consume size of css
const concat = require("gulp-concat"); // Two or more files push on a single file and give them new name
const postcss = require("gulp-postcss"); // Give editing eligibily to css change while render such as adding autoprefixer
const replace = require("gulp-replace"); // For rmoving cash files
const sass = require("gulp-sass")(require("sass")); // Wrap the scss and convert it to the style.css
const sourcemaps = require("gulp-sourcemaps"); // It shows where is the scss written
const uglify = require("gulp-uglify"); // Make js code minify
const babel = require("gulp-babel");
const terser = require("gulp-terser"); // Make js code minify
const useref = require("gulp-useref"); // Multiple css & js file combine and make new file
const imagemin = require("gulp-imagemin"); // Optimize image file size
const nunjucksRender = require("gulp-nunjucks-render"); // Nunjucks convert to html
const prettyHtml = require("gulp-pretty-html"); // Decorating Html
const gulpif = require("gulp-if"); // This gulp plugin is used when we want to run a task only if certain condition is met

// File path variables
const files = {
  htmlPath: "build/**/*.html",

  njkPath: "src/views/**/*.+(html|nunjucks|njk)",
  njkPages: "src/views/pages/**/*.+(html|nunjucks|njk)",

  scssPath: "src/assets/scss/**/*.scss",

  jsPath: "src/assets/js/**/*.js",
  fontPath: "src/assets/fonts/**/*.{eot,svg,ttf,woff,woff2}",

  imagePath: "src/assets/images/**/*",
  buildImagePath: "build/assets/images/**/*",

  vendorPath: "src/assets/vendor/**/*",
  vendorSass: "src/assets/vendor/**/*.scss",
};

// Html Task
function htmlTask() {
  const cbString = new Date().getTime();

  return src(files.njkPages)
    .pipe(
      nunjucksRender({
        path: ["src/views/"],
      })
    )
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(
      prettyHtml({
        indent_size: 4,
        indent_char: " ",
        unformatted: ["code", "pre", "em", "strong", "span", "i", "b", "br"],
        extra_liners: ["head", "body"],
        max_preserve_newlines: 1,
      })
    )
    .pipe(dest("build"));
}

// Scss Task
function scssTask() {
  const autoprefixBrowsers = [
    "> 1%",
    "last 50 versions",
    "firefox >= 4",
    "safari 7",
    "safari 8",
    "IE 8",
    "IE 9",
    "IE 10",
    "IE 11",
  ];
  const plugins = [
    autoprefixer({ overrideBrowserslist: autoprefixBrowsers }),
    cssnano(),
  ];
  return (
    src(files.scssPath, { sourcemaps: true })
      // .pipe(sourcemaps.init())
      .pipe(sass().on("error", sass.logError))
      .pipe(postcss(plugins))
      // .pipe(concat('custom-style-all.min.css'))
      // .pipe(sourcemaps.write('.'))
      .pipe(dest("build/assets/css", { sourcemaps: "." }))
  );
}

// Vendor Scss Task
function vendorScssTask() {
  const plugins = [
    autoprefixer({ overrideBrowserslist: ["last 20 version"] }),
    cssnano(),
  ];
  return (
    src(files.vendorSass, { sourcemaps: true })
      // .pipe(sourcemaps.init())
      .pipe(sass().on("error", sass.logError))
      .pipe(postcss(plugins))
      // .pipe(concat('vendor-style-all.css'))
      // .pipe(sourcemaps.write('.'))
      .pipe(dest("build/assets/css", { sourcemaps: "." }))
  );
}

// Javascript Task
function jsTask() {
  return (
    src(files.jsPath, { sourcemaps: true })
      // .pipe(sourcemaps.init())
      .pipe(
        babel({
          presets: ["@babel/env"],
        })
      )
      // .pipe(concat('custom-script-all.min.js'))
      .pipe(terser())
      // .pipe(sourcemaps.write('.'))
      .pipe(dest("build/assets/js", { sourcemaps: "." }))
  );
}

// Move Vendor Files to build For Client
function vendorMove() {
  return src(files.vendorPath).pipe(dest("build/assets/vendor"));
}

// Move scss Files to build for Client
function scssMove() {
  return src(files.scssPath).pipe(dest("build/assets/scss"));
}

// Image Move Task
function imageTask() {
  return src(files.imagePath).pipe(dest("build/assets/images/"));
}

// Fonts Move Task
function fontsTask() {
  return src(files.fontPath).pipe(dest("build/assets/fonts/"));
}

// BroweserSync Task : Initialize a server
function browserSyncServer(done) {
  browserSync.init({
    port: "3001",
    server: {
      baseDir: "./build",
    },
  });

  done();
}

// BroweserSync Task : Reload the server automatically
function browserSyncReload(done) {
  browserSync.reload();
  done();
}

// Combine Task
function combineTask() {
  return src(files.htmlPath)
    .pipe(useref({ searchPath: "./build" }))
    .pipe(dest("./build"));
}

// Watch Task
function watchTask() {
  watch(
    [
      files.scssPath,
      files.jsPath,
      files.imagePath,
      files.njkPath,
      files.vendorPath,
    ],
    parallel(
      scssTask,
      jsTask,
      imageTask,
      htmlTask,
      vendorMove,
      browserSyncReload
    )
  );
}

// #########################################################
// Default Tasks =======================================
// #########################################################
exports.default = series(
  vendorScssTask,
  parallel(scssTask, jsTask, htmlTask, fontsTask),
  scssMove,
  vendorMove,
  imageTask,
  combineTask,
  browserSyncReload,
  browserSyncServer,
  watchTask
);

// #########################################################
// Non Default Tasks =======================================
// #########################################################

//Image Minify Task
function imageMinify() {
  return src(files.imagePath)
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest("build/assets/images/"));
}

exports.imageMinify = imageMinify;

// Clean build Folder Task
function cleanBuild() {
  return src("build", { read: false }).pipe(clean());
}

exports.cleanBuild = cleanBuild;

// Clean Images Task
function imageClean() {
  return src("build/assets/images/", { read: false, allowEmpty: true }).pipe(
    clean({ force: true })
  );
}

exports.imageClean = imageClean;
