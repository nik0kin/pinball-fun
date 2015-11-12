// Batcity League Score Importer
//
// node ./thisScript <League Number> <Number of Weeks> <Description of Data> <Save Path for JSON> <player & pin config json path>

var fs = require('fs');
var path = require('path');
var Q = require('q');
var _ = require('lodash');

var helper = require('./helper');

var leagueNumber = process.argv[2];
var totalWeeks = process.argv[3];
var dataName = process.argv[4];
var savePath = path.join(process.cwd(), process.argv[5], (dataName + '.json').replace(/ /g, '_'));
var playerAndMachineConfigFile = path.join(process.cwd(), process.argv[6]);
var extraBalls = 1;

var baseUrl = 'http://batcity.league.papa.org';
var urlPath = '/meetResults/' + leagueNumber;

var playerAndMachineConfig;

Q()
  .then(function () {
    return Q.promise(function (resolve, reject) {
      fs.readFile(playerAndMachineConfigFile, function (err, data) {
        if (err) {
          return reject(err);
        }
        playerAndMachineConfig = JSON.parse(String(data));
        // console.log('loaded config: ', JSON.stringify(playerAndMachineConfig));
        resolve();
      });
    });
  })
  .then(function () {
    return helper.scrapeBatcityForScoresQ(baseUrl + urlPath, totalWeeks);
  })
  .then(function (scrapedScoresArray) {
    var scoresJsonArray = [];
    var playerNames = [];
    var pinNames = [];

    _.each(scrapedScoresArray, function (scrapedScore) {
      playerNames = _.union(playerNames, [scrapedScore.fullName]);
      pinNames = _.union(pinNames, [scrapedScore.pinName]);

      var ifpaId = playerAndMachineConfig.players[scrapedScore.fullName].ifpaId;
      var pinConfig = playerAndMachineConfig.pins[scrapedScore.pinName];
      var pinName = pinConfig.as || scrapedScore.pinName;

      var scoreJson = {
        playerIfpaId: ifpaId,
        pinName: pinName,
        pinId: playerAndMachineConfig.pinId,
        score: scrapedScore.score,
        extraBalls: extraBalls
      };

      scoresJsonArray.push(scoreJson);
    });

    console.log('players playing:', playerNames);
    console.log('pins played:', pinNames);
    console.log('scores harvested: ', scrapedScoresArray.length);

    return scoresJsonArray;
  })
  .then(function (scoresJsonArray) {
    return Q.promise(function (resolve, reject) {
      fs.writeFile(savePath, JSON.stringify(scoresJsonArray), function (err) {
        if (err) {
          return reject(err);
        }
        console.log('successfully saved to ' + savePath);
        resolve();
      });
    });
  })
  .fail(function (error) {
    console.log('Error: ', error);
    console.log(error.stack);
  });
