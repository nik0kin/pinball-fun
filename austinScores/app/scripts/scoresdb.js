import {AUSTIN_PLAYERS} from "./austinPlayers";
import {PINS_INFO} from "./pins";

import {addCommas} from "./utils";

import {initSettings, applyPlayerColumnsSetting, applyHideLabelsSetting} from './settings';
import {initFilters, pinFilters} from './filters';
import {updateUrl, loadByUrl} from './url';

import {
  initStatistics, generateAllStatistics,

  allScoresArray, playersArray, pins,
  scoresByPin, allAveragesByPin, allPlaysByPin, allPercentilesByPin,

  playerScoresByPin, playerAverageScoreByPin, playerLowScoreByPin,
  playerHighScoreByPin, playerPlaysByPin, playerPercentilesByPin
} from './statistics';

let playerColumnHeaderTemplate;
let pinballRowTemplate;

export let selectedPlayers = {};

export var init = function () {
  let startTime = Date.now();

  // compile handlebar templates
  playerColumnHeaderTemplate = Handlebars.compile($('#player-column-header').html());
  pinballRowTemplate = Handlebars.compile($('#score-row-template').html());

  initSettings();
  initFilters();

  initStatistics();

  console.log('total loadtime: ' + (Date.now() - startTime) + 'ms');

  setupUI();

  loadByUrl();

  rebuildTableRows();
};

let setupUI = function () {
  setupTotals();

  let austinPlayers = [];
  let playersByName = {};
  _.each(AUSTIN_PLAYERS, (playerName, ifpaId) => {
    austinPlayers.push({playerName, ifpaId});
  });
  // sort Alphabetically + put "Choose a Player" at the top of the dropdown
  austinPlayers = _.sortBy(austinPlayers, (playerObj) => {
    playersByName[playerObj.playerName] = playerObj;
    return playerObj.playerName;
  });

  let playerNames = austinPlayers.map((player) => player.playerName);
  let setupPlayerColumn = function (playerNumber) {
    let context = {
      playerNameTypeaheadId: 'playerName'+playerNumber+'Typeahead'
    };

    let html = playerColumnHeaderTemplate(context);
    $('#player'+playerNumber+'ColumnHeader').html(html);

    $('#'+context.playerNameTypeaheadId).typeahead({
      source: playerNames,
      afterSelect: (selectedPlayerName) => {
        if (!playersByName[selectedPlayerName]) return;
        selectedPlayers[playerNumber] = playersByName[selectedPlayerName].ifpaId;

        rebuildTableRows();
        updateUrl();
      }
    }).change(function () {
      let val = $(this).val();
      // if the player name input is empty, unselect that player column
      if (val === '') {
        selectedPlayers[playerNumber] = undefined;
        rebuildTableRows();
        updateUrl();
      }
    });
  };

  setupPlayerColumn(1);
  setupPlayerColumn(2);
  setupPlayerColumn(3);
  setupPlayerColumn(4);

  $('.dropdown-toggle').dropdown();

  $('#settings-accordion .panel-heading').click(function () {
    let collapseElementId = $(this).find('.panel-title > a').attr('aria-controls');
    $('#'+collapseElementId).collapse('toggle');
  });
};

let setupTotals = function () {
  $('.totalScores').html(addCommas(allScoresArray.length));
  $('.totalPins').html(_.keys(pins).length);
  $('.totalPlayers').html(_.keys(AUSTIN_PLAYERS).length);
  $('.totalEvents').html(RAW_PINBALL_SCORES.length - 1);
};

export let rebuildTableRows = function () {
  let player1 = selectedPlayers[1];
  let player2 = selectedPlayers[2];
  let player3 = selectedPlayers[3];
  let player4 = selectedPlayers[4];

  let player1PinMedianRatios = {}; // compared vs all average
  let player1PinMedianRatiosOrdered;

  $('tbody').html('');
  if (!player1) {
    applyPlayerColumnsSetting();
    return;
  }

  // Determine player1's median compared with AllMedian for each pin
  _.each(playerPercentilesByPin[player1], (percentiles, pinIpdb) => {
    player1PinMedianRatios[pinIpdb] = percentiles[.5] / allPercentilesByPin[pinIpdb][.5];
  });

  // Add rows based on pins played by player 1
  //   order them by Highest (AverageScore / AllAverageScore)
  player1PinMedianRatiosOrdered = _.map(player1PinMedianRatios, (ratio, pinIpdb) => {
    return {pinIpdb, ratio};
  });
  player1PinMedianRatiosOrdered = _.map(_.sortByOrder(player1PinMedianRatiosOrdered, ['ratio'], ['asc'])).reverse();

  _.each(player1PinMedianRatiosOrdered, (ratioObj) => {
    let pinIpdb = ratioObj.pinIpdb;
    let pinInfo = PINS_INFO[pinIpdb] || {};
    let pinMake;

    if (_.isNaN(ratioObj.ratio)) {
      return;
    }

    if (typeof(pinInfo.make) === 'string') {
      // normalize make
      pinMake = pinInfo.make.toLowerCase().replace(' ', '');
    }

    // filter based on make or year
    if (pinMake && !pinFilters.makes[pinMake]) {
      return;
    }
    if (pinInfo.year && !(pinFilters.yearStart <= pinInfo.year
        && pinInfo.year <= pinFilters.yearEnd)) {
      return;
    }

    let allQuartilesString = '';
    allQuartilesString += 'Top Quartile: ';
    allQuartilesString += addCommas(allPercentilesByPin[pinIpdb][.75]);
    allQuartilesString += '\nBottom Quartile: ';
    allQuartilesString += addCommas(allPercentilesByPin[pinIpdb][.25]);
    let context = {
      pinName: pinInfo.name || pinIpdb,
      pinMake: pinInfo.make,
      pinYear: pinInfo.year,

      allMedian: addCommas(allPercentilesByPin[pinIpdb][.5]),
      allQuartilesString,
      allAverage: addCommas(allAveragesByPin[pinIpdb]),
      allPlays: addCommas(allPlaysByPin[pinIpdb])
    };

    if (pinMake) {
      let pinLabelClass = 'label-' + pinMake;
      context.pinLabelClass = pinLabelClass;
    }

    let fillContext = function (num, ifpaId) {
      context['p'+num+'Average'] = addCommas(playerAverageScoreByPin[ifpaId][pinIpdb]);
      context['p'+num+'High']  = addCommas(playerHighScoreByPin[ifpaId][pinIpdb]);
      context['p'+num+'Low']  = addCommas(playerLowScoreByPin[ifpaId][pinIpdb]);
      context['p'+num+'Plays']  = addCommas(playerPlaysByPin[ifpaId][pinIpdb]);
      context['p'+num+'Median'] = addCommas(playerPercentilesByPin[ifpaId][pinIpdb][.5]);

      var medianRatio = playerPercentilesByPin[ifpaId][pinIpdb][.5] / allPercentilesByPin[pinIpdb][.5];
      context['p'+num+'GoodOrBad'] = (medianRatio > 1.25) ? 'good' : (medianRatio < .75) ? 'bad' : '';  
    };

    fillContext(1, player1);
    context.p1Ratio = ratioObj.ratio.toFixed(3);

    if (player2) {
      fillContext(2, player2);
    }

    if (player3) {
      fillContext(3, player3);
    }

    if (player4) {
      fillContext(4, player4);
    }

    let html = pinballRowTemplate(context);
    $('tbody').append(html);
  });

  applyPlayerColumnsSetting();
  applyHideLabelsSetting();
};
