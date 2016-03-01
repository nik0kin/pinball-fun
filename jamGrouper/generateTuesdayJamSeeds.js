var GoogleSpreadsheet = require('google-spreadsheet');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var Q = require('q');

var authAccountInfo = require('../scoreImporters/auth');

var tuesdayJamBattleRoyalleSheetsId = '1xbAKwAtEtKRiIsa8vVuMnlLNB7qPJ61YjkCvl-VG3Vk';
var seedSavePath = path.join(process.cwd(), './app/scripts/tuesdaySeeds.js');

var initAuthedSheetQ = function (googleSheetsId) {
  var sheet = new GoogleSpreadsheet(googleSheetsId);

  return Q.promise(function (resolve, reject) {
    sheet.useServiceAccountAuth(authAccountInfo, function (err) {
      sheet.getInfo(function (err, info) {
        // console.log('spreadsheet info', info);
        resolve(sheet);
      });
    })
  });
};

var getRawSheetQ = function (gSheet) {
  return Q.promise(function (resolve, reject) {
    var firstSheet = 1;
    gSheet.getCells(firstSheet, {
        'min-row': 1,
        'max-row': 50,
        'min-col': 1,
        'max-col': 5,
        'return-empty': true
        }, function(err, data){
      if (err) {
        return reject(err);
      }

      var spreadsheetArray = [];
      _.each(data, function (cell) {
        if (!spreadsheetArray[cell.col]) {
          spreadsheetArray[cell.col] = [];
        }
        if (cell.numericValue === 0 || cell.numericValue) {
          spreadsheetArray[cell.col][cell.row] = Number(cell.numericValue);
        } else {
          spreadsheetArray[cell.col][cell.row] = cell.value;
        }
      });

      resolve(spreadsheetArray);
    });
  });
};

var writeFileQ = function (path, dataString) {
  return Q.promise(function (resolve, reject) {
    fs.writeFile(path, dataString, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

initAuthedSheetQ(tuesdayJamBattleRoyalleSheetsId)
  .then(function (sheet) {
    return getRawSheetQ(sheet);
  })
  .then(function (spreadsheetArrayArray) {
    var column1 = spreadsheetArrayArray[1];
    var seedsArray = [];

    _.each(column1, function (playerName, i) {
      if (i === 1) return; // first row is "Player"
      if (playerName) {
        seedsArray.push(playerName);
      }
    });

    var seedsString = 'export let TUESDAY_SEEDS = ' + JSON.stringify(seedsArray);

    return writeFileQ(seedSavePath, seedsString);
  })
  .fail(function (err) {
    console.log(err);
  });
