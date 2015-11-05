var request = require('request');
var Q = require('q');
var _ = require('lodash');

var domEnv = require('jsdom').env;

exports.scrapeBatcityForScoresQ = function (url, numberOfWeeks) {
  return scrapeWeekForScoresQ(url + '/1');
};

var scrapeWeekForScoresQ = function (url) {
  return Q.promise(function (resolve, reject) {
    request(url, function (error, response, body) {
      domEnv(body, function (errors, window) {
        console.log(errors);
        console.log()

        var $ = require('jquery')(window);

        console.log($('html').html());

      });
    });
  });
};
