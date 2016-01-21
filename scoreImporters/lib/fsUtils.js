var Q = require('q');
var fs = require('fs');

exports.readFileQ = function (path) {
  return Q.promise(function (resolve, reject) {
    fs.readFile(path, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve(String(data));
    });
  });
};

exports.writeJsonFileQ = function (savePath, json, pretty) {
  return Q.promise(function (resolve, reject) {
    var jsonString;
    if (pretty) {
      jsonString = JSON.stringify(json, null, '  ');
    } else {
      jsonString = JSON.stringify(json);
    }

    fs.writeFile(savePath, jsonString, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

exports.isThereQ = function (path) {
  return Q.promise(function (resolve, reject) {
    fs.stat(path, function (err) {
      resolve(!err);
    });
  });
};
