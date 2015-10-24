// http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
var numberWithCommas = function (x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};