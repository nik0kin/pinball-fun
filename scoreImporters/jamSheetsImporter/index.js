var Q = require('q'),
    fs = require('fs'),
    path = require('path')
    _ = require('lodash');

var helper = require('./helper');

var googleSheetsId = process.argv[2],
    dataName = process.argv[3],
    savePath = path.join(process.cwd(), process.argv[4], (dataName + '.json').replace(/ /g, '_')),
    extraBalls = process.argv[5],
    playerAndMachineConfigFile = path.join(process.cwd(), process.argv[6]);

var positionOfTableTop = 6;

var rawScoreSheetsArray,
    playerAndMachineConfig;

Q()
  .then(function () {
    return helper.initAuthedSheet(googleSheetsId);
  })
// Import 3 weeks of scores into json
  .then(function (gSheet) {
    return helper.getRawScoresQ(gSheet, positionOfTableTop);
  })
// Prompts user for ifpaId for each player
//   (future: have name to ifpa dictionary file, and prompt to use the dictionary value or enter a new ifpa (and maybe then update the name to ifpa dictionary))
  .then(function (rawScoreSheetsArrayResult) {
    rawScoreSheetsArray = rawScoreSheetsArrayResult;

    return Q.promise(function (resolve, reject) {
      fs.readFile(playerAndMachineConfigFile, function (err, data) {
        if (err) {
          return reject(err);
        }
        playerAndMachineConfig = JSON.parse(String(data));
        resolve();
      });
    });
  })
  .then(function () {
    var playersTotal = 22;
    var gamesTotal = [4,5,5];
    var gamesNamesArray = [];

    var playerColumn = 1;

    var gamesNamesArray = [];

    var scoresJsonArray = [];

    _.each(rawScoreSheetsArray, function (rawScoreSheet, scoreSheetIndex) {
      console.log('week ' + (scoreSheetIndex+1));
      
      gamesNamesArray[scoreSheetIndex] = [];
      _.times(gamesTotal[scoreSheetIndex], function (g) {
        var gameName = rawScoreSheet[playerColumn + 1 + 2 * g][positionOfTableTop];
        gamesNamesArray[scoreSheetIndex].push(gameName)
      });
      //console.log (gamesNamesArray);
      _.times(playersTotal, function (playerRow) {
        playerRow = playerRow + positionOfTableTop + 2;
        if (!rawScoreSheet[playerColumn][playerRow]) {
          console.log('row# bugged ' + playerRow)
          return;
        }
        var playerName = rawScoreSheet[playerColumn][playerRow];
        //console.log(playerName);
        _.each(gamesNamesArray[scoreSheetIndex], function (gameName, g) {
          var score = rawScoreSheet[playerColumn + 1 + 2 * g][playerRow];
          if (!score) {
            return;
          }
          //console.log('game ' + gameName + ': ' + score);
        
          var scoreJson = {
            playerIfpaId: playerAndMachineConfig.players[playerName],
            pinName: gameName,
            pinId: playerAndMachineConfig.pins[gameName],
            score: score
          };

          scoresJsonArray.push(scoreJson);
        });
      });
    });

    fs.writeFile(savePath, JSON.stringify(scoresJsonArray), function (err) {
      if (err) {
        console.log('failure', err);
        return;
      }
      console.log('success');
    });
  })
// Prompts user for correct Pin names and ids

  .fail(function (error) {
    console.log('Error: ', error);
    console.log(error.stack)
  });
