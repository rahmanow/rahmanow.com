/**
*   Gulp Starter Pack
*   Author: Azat Rahmanov
*   URL : blog.rahmanow.com
*   Twitter : @Azadik
 *  Instagram: @Azadik
**/

/*
  npm install   //To install all dev dependencies of package
  gulp          //To start development and server for live preview
  gulp prod     //To generate minifed files for live server
  gulp deploy   //To deploy your static website to surge.sh
  gulp gitter   // To add, commit and push to repository

*/

const { src, dest, watch, series, parallel } = require('gulp');
const del = require('del'); //For Cleaning build/dist for fresh export
const options = require("./config"); //paths and other options from config.js
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));//For Compiling SASS files
const postcss = require('gulp-postcss'); //For Compiling tailwind utilities with tailwind config
const concat = require('gulp-concat'); //For Concatinating js,scss, css files
const uglify = require('gulp-terser');//To Minify JS files
const imagemin = require('gulp-imagemin'); //To Optimize Images
const cleanCSS = require('gulp-clean-css');//To Minify CSS files
const purgecss = require('gulp-purgecss');// Remove Unused CSS from Styles

//Note : Webp still not supported in major browsers including firefox
// const webp = require('gulp-webp'); //For converting images to WebP format
// const replace = require('gulp-replace'); //For Replacing img formats to webp in html
const logSymbols = require('log-symbols'); //For Symbolic Console logs :) :P
const fileInclude = require('gulp-file-include'); // Include header and footer files to work faster :)
const surge = require('gulp-surge'); // Surge deployment
const git = require('gulp-git'); // Execute command line shell for git push
const babel = require('gulp-babel');
const open = require('gulp-open'); // Opens a URL in a web browser
const tailwindcss = require('tailwindcss');

//Load Previews on Browser on dev
const livePreview = (done) =>
  {
    browserSync.init({ server: { baseDir: options.paths.dist.base }, port: options.config.port || 5000 });
    done();
  }

// Triggers Browser reload
const previewReload = (done) =>
  {
    console.log("\n\t" + logSymbols.info,"Reloading Browser Preview.\n");
    browserSync.reload();
    done();
  }

//Development Tasks
const devHTML = async () =>
  {
    src([`${options.paths.src.base}/**/*.html`,
        `!${options.paths.src.base}/**/header.html`, // ignore
        `!${options.paths.src.base}/**/footer.html` // ignore
        ])
    .pipe(fileInclude({ prefix: '@@', basepath: '@file'}))
    .pipe(dest(options.paths.dist.base));
  }

const devStyles = async () =>
  {
    src(`${options.paths.src.scss}/**/*.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(options.paths.src.scss))
    .pipe(postcss([
          tailwindcss(options.config.tailwindjs),
          require('autoprefixer'),
          ]))
    .pipe(concat({ path: 'style.css'}))
    .pipe(dest(options.paths.dist.css));
  }

const devScripts = async () =>
  {
    src([
        `${options.paths.src.js}/libs/**/*.js`,
        `${options.paths.src.js}/*.js`,
        `!${options.paths.src.js}/**/external/*`
    ])
    .pipe(babel({ignore: [`${options.paths.src.js}/libs/**/*.js`] }))
    .pipe(concat({ path: 'main.js'}))
    .pipe(uglify())
    .pipe(dest(options.paths.dist.js));
  }

const devImages = async () =>
  {
    src(`${options.paths.src.img}/**/*`)
    .pipe(dest(options.paths.dist.img));
  }

function watchFiles(){
  watch(`${options.paths.src.base}/**/*.html`,series(devHTML, devStyles, previewReload));
  watch([options.config.tailwindjs, `${options.paths.src.css}/**/*.scss`],series(devStyles, previewReload));
  watch(`${options.paths.src.js}/**/*.js`,series(devScripts, previewReload));
  watch(`${options.paths.src.img}/**/*`,series(devImages, previewReload));
  console.log("\n\t" + logSymbols.info,"Watching for Changes..\n");
}

function devClean(){
  console.log("\n\t" + logSymbols.info,"Cleaning dist folder for fresh start.\n");
  return del([options.paths.dist.base]);
}

//Production Tasks (Optimized Build for Live/Production Sites)
function prodHTML(){
  return src(`${options.paths.src.base}/**/*.html`)
  .pipe(dest(options.paths.build.base));
}

function prodStyles(){
  return src(`${options.paths.dist.css}/**/*`)
  .pipe(purgecss(
      {
        content: ['src/**/*.{html,js}'],
        defaultExtractor: content => {
          const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
          const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []
          return broadMatches.concat(innerMatches)
        }
      }))
  .pipe(cleanCSS({compatibility: 'ie8'}))
  .pipe(dest(options.paths.build.css));
}

function prodScripts(){
  return src([
    `${options.paths.src.js}/libs/**/*.js`,
    `${options.paths.src.js}/**/*.js`
  ])
  .pipe(concat({ path: 'scripts.js'}))
  .pipe(uglify())
  .pipe(dest(options.paths.build.js));
}

function prodImages(){
  return src(options.paths.src.img + '/**/*')
  .pipe(imagemin())
  .pipe(dest(options.paths.build.img));
}

function prodClean(){
  console.log("\n\t" + logSymbols.info,"Cleaning build folder for fresh start.\n");
  return del([options.paths.build.base]);
}

function buildFinish(done){
  console.log("\n\t" + logSymbols.info,`Production build is complete. Files are located at ${options.paths.build.base}\n`);
  done();
}


async function gitAdd() {
  return src(`${options.paths.root}`)
  .pipe(git.add())
}

async function gitCommit() {
  return src(`${options.paths.root}`)
  .pipe(git.commit(`${options.deploy.gitCommitMessage}`, {args:'-m'}))
}

async function gitPush() {
  git.push(`${options.deploy.gitURL}`, `${options.deploy.gitBranch}`, errorFunction);
}

async function surgeDeploy() {
  return surge({
  project: `${options.paths.dist.base}`, // Path to your static build directory
  domain: `${options.deploy.surgeUrl}`  // Your domain or Surge subdomain
  });
}

function openBrowser(done) {
  const opt = {uri: `https://${options.deploy.surgeUrl}`};
  return src('./')
  .pipe(open(opt));
  done();
}

const errorFunction = (err) => {
  if (err) throw err;
}

// Deploy command - gulp deploy
exports.deploy = series(surgeDeploy, openBrowser); // Deploy your static website to surge.sh

// Gitter command - gulp gitter
exports.gitter = series(gitAdd, gitCommit, gitPush); // 3 in 1 - add, commit and push.

// Default gulp command - gulp
exports.default = series(
  devClean, // Clean Dist Folder
  parallel(devStyles, devScripts, devImages, devHTML), //Run All tasks in parallel
  livePreview, // Live Preview Build
  watchFiles // Watch for Live Changes
);

// Production command - gulp prod
exports.prod = series(
  prodClean, // Clean Build Folder
  parallel(prodStyles, prodScripts, prodImages, prodHTML), //Run All tasks in parallel
  buildFinish
);