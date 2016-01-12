var request = require('request');
var Q = require('q');
var _ = require('lodash');

var domEnv = require('jsdom').env;

exports.scrapeBatcityForScoresQ = function (url, numberOfWeeks) {
  var promises = [];
  _.times(numberOfWeeks, function (i) {
    var weekNumber = i + 1;
    promises.push(scrapeWeekForScoresQ(url + '/' + weekNumber));
  });
  return Q.all(promises)
    .then(function (scrapedScoresArrays) {
      return _.flatten(scrapedScoresArrays);
    });
};

var scrapeWeekForScoresQ = function (url) {
  var scores = [];
  return Q.promise(function (resolve, reject) {
    console.log('requesting: ', url);
    request(url, function (error, response, body) {
      domEnv(body, function (errors, window) {

        var $ = require('jquery')(window);

        var date = $('.banner .vMiddleContainer .blockLeft h1 small')
            .html()
            .split('-')[1];
        date = new Date(date).valueOf();

        _.each($('.matchResults'), function (matchResultElement) {
          var $matchResult = $(matchResultElement);
          var $matchResultsPlayers = $matchResult.find('.matchResultsPlayers');
          var $matchResultsGames = $matchResult.find('.matchResultsGame');

          var playerNames = _.map($matchResultsPlayers.find('.playerName'), function (playerNameElement) {
            return $(playerNameElement).html();
          });

          _.each($matchResultsGames, function (matchResultGameElement) {
            var $matchResultGame = $(matchResultGameElement);
            var pinName = $matchResultGame.find('.header1').html();
            //console.log(pinName);
            _.each($matchResultGame.find('.machineScoreField'), function (machineScoreFieldElement, i) {
              var score = $(machineScoreFieldElement).html();
              // first just grab the number
              //   based on http://stackoverflow.com/questions/5917082/regular-expression-to-match-numbers-with-or-without-commas-and-decimals-in-text
              score = score.match(/.*(\d+|\d{1,3}(,\d{3})*)(\.\d+)?.*/g);
              if (!score || !score[0] || !_.isString(score[0])) {
                // console.log('bad scoreField!', score);
                return;
              }
              // then remove the white space and commas
              score = score[0].replace(/(\s|,)/g, '');

              //console.log(playerNames[i] + ': ', score);
              if (!score || !_.isNumber(Number(score))) {
                // console.log('bad score!', score);
                return;
              }

              scores.push({
                fullName: playerNames[i],
                pinName: pinName,
                date: date,
                score: Number(score)
              });
            });
          });
        });

        resolve(scores);
      });
    });
  });
};
