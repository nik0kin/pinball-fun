import {AUSTIN_PLAYERS} from "./austinPlayers";
import {PINS_INFO, mapToIpdbId} from "./pins";

import {addCommas} from "./utils";

import {initSettings, applyPlayerColumnsSetting, applyHideLabelsSetting} from './settings';
import {initFilters, pinFilters} from './filters';
import {updateUrl, loadByUrl} from './url';

import {
  initStatistics, generateAllStatistics,

  allScoresArray, playersArray, pinsArray,
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
  let chooseAPlayerDefault = [{playerName: 'Choose a Player', ifpaId: 99999999}];
  _.each(AUSTIN_PLAYERS, (playerName, ifpaId) => {
    austinPlayers.push({playerName, ifpaId});
  });
  // sort Alphabetically + put "Choose a Player" at the top of the dropdown
  austinPlayers = _.sortBy(austinPlayers, (playerObj) => {
    return playerObj.playerName;
  });
  chooseAPlayerDefault.push.apply(chooseAPlayerDefault, austinPlayers);
  austinPlayers = chooseAPlayerDefault;

  let setupPlayerColumn = function (playerNumber) {
    let context = {
      playerIdDropdownMenu: 'player'+playerNumber+'DropdownMenu',
      players: austinPlayers
    };

    let html = playerColumnHeaderTemplate(context);
    $('#player'+playerNumber+'ColumnHeader').html(html);
  };

  setupPlayerColumn(1);
  setupPlayerColumn(2);
  setupPlayerColumn(3);
  setupPlayerColumn(4);

  $('.dropdown-toggle').dropdown();
  $(".player-header .dropdown-menu li a").click(function(){
    let $dropdownButton = $(this).parents(".dropdown").find('.btn');
    $dropdownButton.html($(this).text() + ' <span class="caret"></span>');
    $dropdownButton.val($(this).data('value'));

    let columnId = $dropdownButton.attr('id').match(/player(\d)DropdownMenu/)[1];
    let newSelectedPlayer = $(this).attr('data-id');

    if (newSelectedPlayer === "99999999") {
      selectedPlayers[columnId] = undefined;
    } else {
      selectedPlayers[columnId] = newSelectedPlayer;
    }

    //console.log('player '+columnId+': ', selectedPlayers[columnId])

    rebuildTableRows();
    updateUrl();
  });

  $('#settings-accordion .panel-heading').click(function () {
    let collapseElementId = $(this).find('.panel-title > a').attr('aria-controls');
    $('#'+collapseElementId).collapse('toggle');
  });
};

let setupTotals = function () {
  $('.totalScores').html(addCommas(allScoresArray.length));
  $('.totalPins').html(pinsArray.length);
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
    return;
  }

  // Determine player1's median compared with AllMedian for each pin
  _.each(playerPercentilesByPin[player1], (percentiles, pinName) => {
    player1PinMedianRatios[pinName] = percentiles[.5] / allPercentilesByPin[pinName][.5];
  });

  // Add rows based on pins played by player 1
  //   order them by Highest (AverageScore / AllAverageScore)
  player1PinMedianRatiosOrdered = _.map(player1PinMedianRatios, (ratio, pinName) => {
    return {pinName, ratio};
  });
  player1PinMedianRatiosOrdered = _.map(_.sortByOrder(player1PinMedianRatiosOrdered, ['ratio'], ['asc'])).reverse();

  _.each(player1PinMedianRatiosOrdered, (ratioObj) => {
    let pinName = ratioObj.pinName;
    let pinIPDBId = mapToIpdbId[pinName];
    let pinInfo = PINS_INFO[pinIPDBId] || {};
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
    allQuartilesString += addCommas(allPercentilesByPin[pinName][.75]);
    allQuartilesString += '\nBottom Quartile: ';
    allQuartilesString += addCommas(allPercentilesByPin[pinName][.25]);
    let context = {
      pinName: pinInfo.name || pinName,
      pinMake: pinInfo.make,
      pinYear: pinInfo.year,

      allMedian: addCommas(allPercentilesByPin[pinName][.5]),
      allQuartilesString,
      allAverage: addCommas(allAveragesByPin[pinName]),
      allPlays: addCommas(allPlaysByPin[pinName])
    };

    if (pinMake) {
      let pinLabelClass = 'label-' + pinMake;
      context.pinLabelClass = pinLabelClass;
    }

    let fillContext = function (num, ifpaId) {
      context['p'+num+'Average'] = addCommas(playerAverageScoreByPin[ifpaId][pinName]);
      context['p'+num+'High']  = addCommas(playerHighScoreByPin[ifpaId][pinName]);
      context['p'+num+'Low']  = addCommas(playerLowScoreByPin[ifpaId][pinName]);
      context['p'+num+'Plays']  = addCommas(playerPlaysByPin[ifpaId][pinName]);
      context['p'+num+'Median'] = addCommas(playerPercentilesByPin[ifpaId][pinName][.5]);

      var medianRatio = playerPercentilesByPin[ifpaId][pinName][.5] / allPercentilesByPin[pinName][.5];
      context['p'+num+'GoodOrBad'] = (medianRatio > 1.25) ? 'good' : (medianRatio < .75) ? 'bad' : '';  
      /*
      let goodOrBad = '';
      if (playerPercentilesByPin[ifpaId][pinName][.5] > allPercentilesByPin[pinName][.75]) {
        goodOrBad = 'good';
      } else if (playerPercentilesByPin[ifpaId][pinName][.5] < allPercentilesByPin[pinName][.25]) {
        goodOrBad = 'bad';
      }
      context['p'+num+'GoodOrBad'] = goodOrBad;
      */
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
