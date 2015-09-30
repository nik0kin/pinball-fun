var _ = require('lodash');

// builds a regexp to match any of the strings in the array
exports.getMatchArrayRegexp = function (array) {
  var regexpText = '(';
  _.each(array, function (string, i) {
    regexpText = regexpText + string;
    if (i + 1 === array.length) {
      regexpText += ')';
    } else {
      regexpText += '|';
    }
  });

  return new RegExp(regexpText, 'i');
};
