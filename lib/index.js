var debug = require('debug')('metalsmith-inline-svg');
var extname = require('path').extname;
var cheerio = require('cheerio');
var DOMParser = require('xmldom').DOMParser;

module.exports = plugin

function plugin(options) {

  options = options || {};
  options.selector = options.selector || 'img.svg';

  if (!options.hasOwnProperty('removeDefs')) {
    options.removeDefs = true;
  }

  return function (files, metalsmith, done) {
    debug('running metalsmith-inline-svg');

    setImmediate(done);

    Object.keys(files)
      .forEach(function (file) {

        if (!html(file)) return;

        debug('processing file: %s', file);

        var $ = cheerio.load(files[ file ].contents.toString());

        $(options.selector).each(function (index, element) {

          // Get the src file
          var src = $(element).attr('src').replace(/^\/|\/$/g, '');;

          debug('attempting to inline: %s', src);

          // Get the corresponding svg file (try windows path too)
          var svgFile = files[src] || files[src.replace(/\//g, '\\')];

          if (svgDoc === 'undefined') {
            debug('file not found: %s', src);
          } else {

            // parse the xml and get the root svg element
            var parser = new DOMParser();
            var result = parser.parseFromString(svgFile.contents.toString(), 'image/svg+xml');
            var svgDoc = result.getElementsByTagName('svg')[0];

            if (options.removeDefs) {
              // Remove empty defs tags which xmldom appears to be closing incorrectly
              var defs = svgDoc.getElementsByTagName("defs");
              for (var i = 0; i < defs.length; i++) {
                  svgDoc.removeChild(defs[i]);
              }
            }

            // Remove some of the attributes that might trip us up
            svgDoc.removeAttribute('xmlns:a');
            svgDoc.removeAttribute('width');
            svgDoc.removeAttribute('height');

            // Copy attributes back in
            Object.keys(element.attribs)
              .forEach(function (item) {
                if (item !== 'src' && item !== 'alt') {
                  svgDoc.setAttribute(item, element.attribs[item]);
                }
              });

            // replace the image with the svg content
            $(element).replaceWith(svgDoc.toString());

            debug('replaced: %s', src);
          }
        });

        debug('saving modified html');

        files[file].contents = $.html();
      });
  };
}

function html(file) {
  return /\.html?/.test(extname(file));
}
