var GoogleSpreadsheet = require('google-spreadsheet'),
    moment = require('moment'),
    _ = require('lodash'),
    Q = require('q');

var authAccountInfo = require('../auth');

exports.initAuthedSheet = function (googleSheetsId) {
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

// returns an array of the 3 week sheets 
exports.getRawScoresQ = function (sheet, positionOfTableTop, numOfSheetsToRead) {
  var playersNum = 22;
  var gamesNum = 5;

  var promises = [];
  _.times(numOfSheetsToRead, function (i) {
    var sheetTabNum = i + 1;
    promises.push(getRawSheetQ(sheet, sheetTabNum, playersNum, gamesNum, positionOfTableTop));
  });

  return Q.all(promises);
};

var getRawSheetQ = function (gSheet, sheetNum, playersNum, gamesNum, positionOfTableTop) {
  return Q.promise(function (resolve, reject) {

    gSheet.getCells(sheetNum, {
        'min-row': 1,
        'max-row': positionOfTableTop + playersNum + 1,
        'min-col': 1,
        'max-col': 1 + 2 * gamesNum,
        'return-empty': true
        }, function(err, data){
      if (err) {
        return reject(err);
      }
      //console.log( 'pulled in '+data.length + ' rows');
      //console.log(data)

      var spreadsheetArray = [];
      _.each(data, function (cell) {
        if (!spreadsheetArray[cell.col]) {
          spreadsheetArray[cell.col] = [];
        }
        var date = (""+cell.value).split('/');
        if (date.length > 1) { // weak ass code
          date = moment(cell.value, ['MM/DD/YYYY']).valueOf();
          spreadsheetArray[cell.col][cell.row] = date.valueOf();
        } else if (cell.numericValue === 0 || cell.numericValue) {
          spreadsheetArray[cell.col][cell.row] = Number(cell.numericValue);
        } else {
          spreadsheetArray[cell.col][cell.row] = cell.value;
        }
      });

      resolve(spreadsheetArray);
    });
  });
};
