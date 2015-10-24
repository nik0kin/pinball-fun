var compileSass = require('broccoli-sass'),
  concatenate = require('broccoli-concat'),
  mergeTrees  = require('broccoli-merge-trees'),
  pickFiles   = require('broccoli-static-compiler'),
  uglifyJs    = require('broccoli-uglify-js'),
  jade        = require('broccoli-jade'),
  esTranspiler = require('broccoli-babel-transpiler'),
  env = require('broccoli-env').getEnv();

var app = 'app',
    appCss,
    appHtml,
    appLib,
    appJs,
    appImg,
    appFonts;

var pinballScores,
    rawScores = 'rawScores';

/**
 * move the index.html file from the project /app folder
 * into the build assets folder
 */
appHtml = pickFiles(app, {
  srcDir  : '/',
  files   : ['**.jade'],
  destDir : '/'
});

appHtml = jade(appHtml, {pretty: true});

/**
 * put all the bower dependencies under /lib
 */
var bower = 'bower_components';
var bowerItems = [
  {
    dir: '/lodash',
    files: ['lodash.js']
  },
  {
    dir: '/jquery/dist',
    files: ['jquery.js']
  },
  {
    dir: '/handlebars',
    files: ['handlebars.js']
  }
];
var bowerTrees = [];

bowerItems.forEach(function (item) {
  var tree = pickFiles(bower, {
    srcDir: item.dir,
    files: item.files,
    destDir: '/lib'
  });
  bowerTrees.push(tree);
});

appLib = mergeTrees(bowerTrees);

appLib = concatenate(appLib, {
  inputFiles : ['**/*.js'],
  outputFile : '/vendor.js'
});

/**
 * concatenate and compress all of our JavaScript files in
 * the project /app folder into a single app.js file in
 * the build assets folder
 */
appJs = concatenate(app, {
  inputFiles : ['*.js'],
  outputFile : '/app.js'
});

appJs = esTranspiler(appJs, {
  modules: 'ignore'
});

//if (env === 'production') {
//  appJs = uglifyJs(appJs, {
//    compress: true,
//    mangle: true
//  });
//}


// appImg = pickFiles(app, {
//   srcDir  : '/assets',
//   files   : ['**/*.png'],
//   destDir : '/img'
// });


// Compile Sass to 1 css file
appCss = compileSass([app], 'style.scss', '/style.css');


// Turn pinball scores json into an array with concat
pinballScores = concatenate(rawScores, {
  inputFiles : ['*.json'],
  outputFile : '/pinballScores.js',

  header: 'var RAW_PINBALL_SCORES=[',
  separator: ',',
  footer: ']'
});

// merge HTML, JavaScript and CSS trees into a single tree and export it
module.exports = mergeTrees([appHtml, appLib, appJs, appCss, pinballScores]);
