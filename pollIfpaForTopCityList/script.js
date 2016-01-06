
// PARAMETERS

var RANKINGS_ID = 105; // texas
var NUM_OF_PLAYERS_POLLED = 500;
var CITY_MATCH_TERMS = ['austin', 'cedar park', 'round rock', 'leander'];
var KNOWN_PLAYERS = ['jesse bodell', 'brooke davis', 'paul williams', 'amit patel', 'matt macdougall', 'justin mcbride', 'langel', 'Amanda Boudreault', 'MacAlpine', 'Doreen Esparza', 'Jason Higgins', 'Mark Meserve', 'Matthew Murphy', 'Ray Ford', 'Jason Newman', 'Steve Brownell', 'Zach Schroeder', 'Nick Fowler', 'Phoenix Valentine', 'Jessica Shepherd', 'Mark Brown ATX'];
var IFPA_URL = 'http://www.ifpapinball.com/rankings/custom_view.php?t=' + NUM_OF_PLAYERS_POLLED + '&id=' + RANKINGS_ID + '&p=1';
var SAVE_PATH = 'austinRankings/austin_players.js';

/////////////////

var domEnv = require('jsdom').env,
    fs = require('fs'),
    _ = require('lodash');

var phantomWrapper = require('./lib/phantomWrapper'),
    regexpUtils = require('./lib/regexpUtils');

// build regexps 
var cityRegexp = regexpUtils.getMatchArrayRegexp(CITY_MATCH_TERMS),
    playersRegexp = regexpUtils.getMatchArrayRegexp(KNOWN_PLAYERS);


var parseIfpaPage = function (ifpaPage) {
  domEnv(ifpaPage, function (errors, window) {
    console.log(errors);
    console.log()

    var $ = require('jquery')(window);

    var $playerTable = $('.viewtab');
    var playerTrArray = $playerTable.find('tr');

    var playersInCityArray = [];

    _.each(playerTrArray, function (playerTr, rank) {
      var $playerTr = $(playerTr);
      var playerRowAsString = $playerTr.html();
      var playerCityAsString = $playerTr.find('td:nth-child(3)').html() + '';

      var found = playerCityAsString.search(cityRegexp) !== -1 || playerRowAsString.search(playersRegexp) !== -1;
      
      if (found) {
        var ifpaProfileUrl = $playerTr.find('td:nth-child(2) > a').attr('href'),
            ifpaIdRegexp = /\/player\.php\?t=p&p=(\d+)/;

        if (!ifpaProfileUrl) {
          return;
        }

        var playerInfo = {
          playerName: $playerTr.find('td:nth-child(2) > a').html(),
          ifpaId: ifpaProfileUrl.match(ifpaIdRegexp)[1],
          texasRank: rank,
          worldRank: $playerTr.find('td:nth-child(4)').html(),
          points: $playerTr.find('td:nth-child(5)').html(),
          events: $playerTr.find('td:nth-child(6)').html()
        };

        playersInCityArray.push(playerInfo);
      }
    });

    // save to file
    var fileContent = 'var PINBALL_PLAYERS = ' + JSON.stringify(playersInCityArray);
    fs.writeFileSync(SAVE_PATH, fileContent, 'utf8');
    console.log('successfully save to ' + SAVE_PATH);
  });
};

phantomWrapper.getPhantomPage(IFPA_URL, parseIfpaPage);
