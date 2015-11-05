var Q = require('q');

var helper = require('./helper');

var leagueNumber = process.argv[2];
var totalWeeks = process.argv[3];

var baseUrl = 'http://batcity.league.papa.org';
var urlPath = '/meetResults/' + leagueNumber;


Q()
  .then(function () {
    return helper.scrapeBatcityForScoresQ(baseUrl + urlPath, totalWeeks);
  })
  .fail(function (error) {
    console.log('Error: ', error);
    console.log(error.stack);
  });
