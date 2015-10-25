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
