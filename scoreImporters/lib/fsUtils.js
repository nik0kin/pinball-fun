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

exports.writeJsonFileQ = function (savePath, json) {
  return Q.promise(function (resolve, reject) {
    fs.writeFile(savePath, JSON.stringify(json), function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};
