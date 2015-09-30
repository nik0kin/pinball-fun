var phantom = require('phantom');

exports.getPhantomPage = function (url, callback) {
  phantom.create(function (ph) {
    ph.createPage(function (page) {
      page.open(url, function (status) {
        console.log("opened url: " + url + " ? ", status);
        page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function() {
          page.evaluate(function () { return $('html').html(); }, function (result) {
            callback(result);
            ph.exit();
          });
        });
      });
    });
  });
};
