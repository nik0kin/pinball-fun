// http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
var numberWithCommas = function (x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// modified from
//http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
var getUrlParameter = function (sParam) {
  var sPageURL;
  if (window.location.hash) {
    sPageURL = window.location.hash.substring(3);  // skipping "#/?"
  } else {
    sPageURL = window.location.search.substring(1);
  }

  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
};

// percentile: a number between 0 and 1.0. .5 would be 50% or the median (I think)
// based on https://github.com/Delapouite/lodash.math/blob/master/lodash.math.js
var findPercentile = function (array, percentile) {
  let index = percentile * array.length;
  let result;

  array = _.sortBy(array, _.identity);
  if (Math.floor(index) == index) {
    result = (array[index-1] + array[index])/2;
  } else {
    result = array[Math.floor(index)];
  }
  return result;
};
