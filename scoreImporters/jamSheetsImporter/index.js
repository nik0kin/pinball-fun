// Tuesday Jam Score Importer
//
// node ./thisScript <Google Sheets Id> <Description of Data> <Save Path for JSON> <Amount of Extra Balls> <player & pin config json path> <array of games per week>

var Q = require('q'),
    fsUtils = require('../lib/fsUtils'),
    path = require('path')
    _ = require('lodash');

var helper = require('./helper');

var googleSheetsId = process.argv[2],
    dataName = process.argv[3],
    savePath = path.join(process.cwd(), process.argv[4], (dataName + '.json').replace(/ /g, '_')),
    extraBalls = Number(process.argv[5]),
    playerAndMachineConfigFile = path.join(process.cwd(), process.argv[6]),
    gamesTotal = JSON.parse(process.argv[7]); // an array of the amount of games played each week. eg [4,5,5]

var positionOfTableTop = 6;
var playerColumn = 1;

var rawScoreSheetsArray,
    playerAndMachineConfig;

Q()
  .then(function () {
    return helper.initAuthedSheet(googleSheetsId);
  })
// Import 3 weeks of scores into json
  .then(function (gSheet) {
    return helper.getRawScoresQ(gSheet, positionOfTableTop, gamesTotal.length);
  })
  .then(function (rawScoreSheetsArrayResult) {
    rawScoreSheetsArray = rawScoreSheetsArrayResult;

    return fsUtils.isThereQ(playerAndMachineConfigFile);
  })
  .then(function (configFileExists) {
    if (!configFileExists) {
      // generate an empty config file
      return fsUtils.writeJsonFileQ(playerAndMachineConfigFile, getEmptyConfigJson(), true);
    }

    return fsUtils.readFileQ(playerAndMachineConfigFile)
      .then(function (data) {
        playerAndMachineConfig = JSON.parse(data);
        //console.log('loaded config: ', JSON.stringify(playerAndMachineConfig));
      })
      .then(function () {
        var scoresJsonArray = getScoresJson();
        return fsUtils.writeJsonFileQ(savePath, scoresJsonArray)
          .then (function () {
            console.log('successfully saved to ' + savePath);
          });
      });
  })
  .fail(function (error) {
    console.log('Error: ', error);
    console.log(error.stack);
  });

var getScoresJson = function () {
  var playersTotal = _.keys(playerAndMachineConfig.players).length;
  var gamesNamesArray = [];
  var scoresJsonArray = [];

  _.each(rawScoreSheetsArray, function (rawScoreSheet, scoreSheetIndex) {
    //console.log('week ' + (scoreSheetIndex+1));
    var date = rawScoreSheet[1][2];
    console.log('Reading scores from ' + new Date(date).toString());

    gamesNamesArray[scoreSheetIndex] = [];
    _.times(gamesTotal[scoreSheetIndex], function (g) {
      var gameName = rawScoreSheet[playerColumn + 1 + 2 * g][positionOfTableTop];
      gamesNamesArray[scoreSheetIndex].push(gameName)
    });
    //console.log (gamesNamesArray);
    _.times(playersTotal, function (playerRow) {
      playerRow = playerRow + positionOfTableTop + 2;
      if (!rawScoreSheet[playerColumn][playerRow]) {
        console.log('row #' + playerRow + ' bugged');
        return;
      }
      var playerName = rawScoreSheet[playerColumn][playerRow];
      //console.log(playerName);
      _.each(gamesNamesArray[scoreSheetIndex], function (gameName, g) {
        var score = rawScoreSheet[playerColumn + 1 + 2 * g][playerRow];
        if (!_.isNumber(score) || score <= 1 || _.isNaN(score)) {
          // 0 = no show
          // 1 = disqualify
          console.log('skipping: ' + playerName + ' ' + score + ' ' + gameName);
          return;
        }
        //console.log('game ' + gameName + ': ' + score);
        var pinName = gameName,
            pinIpdbId,
            pinId = playerAndMachineConfig.pins[gameName];

        if (_.isObject(playerAndMachineConfig.pins[gameName])) {
          var pinConfig = playerAndMachineConfig.pins[gameName];
          pinIpdbId = pinConfig.pinIpdbId;
          if (pinConfig.as) {
            //console.log(pinName + ' => ' + pinConfig.as);
            pinName = pinConfig.as;
          }
          if (pinConfig.id) {
            pinId = pinConfig.id;
          } else {
            throw "missing id for " + gameName;
          }
        }

        var scoreJson = {
          playerIfpaId: playerAndMachineConfig.players[playerName],
          pinName: pinName,
          pinIpdbId: pinIpdbId,
          pinId: pinId,
          date: date,
          score: score,
          extraBalls: extraBalls
        };

        scoresJsonArray.push(scoreJson);
      });
    });
  });

  console.log('found ' + scoresJsonArray.length + ' scores');

  return scoresJsonArray;
};

var getEmptyConfigJson = function () {
  var config = {pins: {}, players: {}};
  _.each(rawScoreSheetsArray, function (rawScoreSheet, scoreSheetIndex) {
    //console.log('week ' + (scoreSheetIndex+1));

    _.times(gamesTotal[scoreSheetIndex], function (pinNum) {
      var pinName = rawScoreSheet[playerColumn + 1 + 2 * pinNum][positionOfTableTop];
      config.pins[pinName] = {pinIpdbId: 0, id: ""};
    });

    _.each(_.keys(rawScoreSheet[playerColumn]), function (playerRow) {
      playerRow = Number(playerRow) + positionOfTableTop + 2;
      if (!rawScoreSheet[playerColumn][playerRow]) {
        return;
      }
      var playerName = rawScoreSheet[playerColumn][playerRow];
      config.players[playerName] = 0;
    });
  });
  console.log ('prepared config for ' + _.keys(players).length + 'players');
  return config;
};
