$(function () {
  const PERCENTILES = [.25, .5, .75];

  let playerColumnHeaderTemplate = Handlebars.compile($('#player-column-header').html());
  let pinballRowTemplate = Handlebars.compile($('#score-row-template').html());

  let allScoresArray = [];
  let playersArray = [];
  let pinsArray = [];

  let scoresByPin = {}; // key is pinName, value is an array of scores
  let allAveragesByPin = {}; // key is pinName, value is average of that pin
  let allPlaysByPin = {}; // key is pinName, value is total plays of that pin
  let allPercentilesByPin = {}; // key is pinName, value is an object of percentiles

  let playerScoresByPin = {}; // key is playerId, value is {pinName : [array of scores]} 
  let playerAverageScoreByPin = {}; // key is playerId, value is a {} pinName: average
  let playerLowScoreByPin = {}; // key is playerId, value is a {} pinName: low
  let playerHighScoreByPin = {}; // key is playerId, value is a {} pinName: high
  let playerPlaysByPin = {};
  let playerPercentilesByPin = {};

  let selectedPlayers = {};

  $(document).ready(function () {
    let startTime = Date.now();

    // load all the json into one array
    _.each(RAW_PINBALL_SCORES, (rawArray) => {
      // http://stackoverflow.com/questions/9650826/append-an-array-to-another-array-in-javascript
      allScoresArray.push.apply(allScoresArray, rawArray);
    });

    // Determine which pins and which players
    _.each(allScoresArray, (score) => {
      pinsArray = _.union(pinsArray, [score.pinName]);
      playersArray = _.union(playersArray, [score.playerIfpaId]);

      // and sort scores by pin
      if (!scoresByPin[score.pinName]) {
        scoresByPin[score.pinName] = [];
      }
      scoresByPin[score.pinName].push(score);
    });

    console.log(pinsArray.length + ' pins');
    console.log(playersArray.length + ' players');
    console.log('pinsArray', pinsArray);
    console.log('playersArray', playersArray);

    _.each(playersArray, (playerId) => {
      playerAverageScoreByPin[playerId] = {};
      playerLowScoreByPin[playerId] = {};
      playerHighScoreByPin[playerId] = {};
      playerPlaysByPin[playerId] = {};
      playerScoresByPin[playerId] = {};
      playerPercentilesByPin[playerId] = {};
    });

    // Determine averages
    _.each(pinsArray, (pinName) => {
      var totalScore = 0;
      var totalScoreByPlayer = {};
      var totalPlaysByPlayer = {};

      _.each(scoresByPin[pinName], (score) => {
        totalScore += score.score;

        if (!totalScoreByPlayer[score.playerIfpaId]) {
          totalScoreByPlayer[score.playerIfpaId] = 0;
          totalPlaysByPlayer[score.playerIfpaId] = 0;
          playerLowScoreByPin[score.playerIfpaId][pinName] = score.score;
          playerHighScoreByPin[score.playerIfpaId][pinName] = score.score;
          playerScoresByPin[score.playerIfpaId][pinName] = [];
        }
        totalScoreByPlayer[score.playerIfpaId] += score.score;
        totalPlaysByPlayer[score.playerIfpaId]++;

        // check for a players lowest/highest on each pin
        if (score.score < playerLowScoreByPin[score.playerIfpaId][pinName]) {
          playerLowScoreByPin[score.playerIfpaId][pinName] = score.score;
        }
        if (score.score > playerHighScoreByPin[score.playerIfpaId][pinName]) {
          playerHighScoreByPin[score.playerIfpaId][pinName] = score.score;
        }

        // add Score to playerScoresByPin
        playerScoresByPin[score.playerIfpaId][pinName].push(score);
      });

      // Determine all averages & plays for each pin
      allPlaysByPin[pinName] = scoresByPin[pinName].length;
      allAveragesByPin[pinName] = Math.round(totalScore / allPlaysByPin[pinName]);

      // Determine percentiles for all pins
      allPercentilesByPin[pinName] = {};
      let scoresArray = _.map(scoresByPin[pinName], (scoreObject) => {
        return scoreObject.score;
      });
      _.each(PERCENTILES, (percentile) => {
        allPercentilesByPin[pinName][percentile] = findPercentile(scoresArray, percentile);
      });

      // Determine averages & percentiles of each pin for each player
      _.each(playersArray, (playerId) => {
        playerPlaysByPin[playerId][pinName] = totalPlaysByPlayer[playerId];
        playerAverageScoreByPin[playerId][pinName] = Math.round(totalScoreByPlayer[playerId] / playerPlaysByPin[playerId][pinName]);

        playerPercentilesByPin[playerId][pinName] = {};
        let playerScoresArray = _.map(playerScoresByPin[playerId][pinName], (scoreObject) => {
          return scoreObject.score;
        });
        _.each(PERCENTILES, (percentile) => {
          playerPercentilesByPin[playerId][pinName][percentile] = findPercentile(playerScoresArray, percentile);
        });
      });

    });

    console.log('allAveragesByPin', allAveragesByPin);
    console.log('allPlaysByPin', allPlaysByPin);

    console.log('playerAverageScoreByPin', playerAverageScoreByPin);
    console.log('playerLowScoreByPin', playerLowScoreByPin);
    console.log('playerHighScoreByPin', playerHighScoreByPin);
    console.log('playerPlaysByPin', playerPlaysByPin);
    console.log('playerPercentilesByPin', playerPercentilesByPin);

    console.log('total loadtime: ' + (Date.now() - startTime) + 'ms');

    setupUI();
    loadByUrl();
  });

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

      console.log('player '+columnId+': ', selectedPlayers[columnId])

      rebuildTableRows();
      updateUrl();
    });

    $('#filtersHeading').click(() => {
      $('#filtersCollapse').collapse('toggle');
    });
  };

  let setupTotals = function () {
    $('.totalScores').html(numberWithCommas(allScoresArray.length));
    $('.totalPins').html(pinsArray.length);
    $('.totalPlayers').html(_.keys(AUSTIN_PLAYERS).length);
    $('.totalEvents').html(RAW_PINBALL_SCORES.length - 1);
  };

  let rebuildTableRows = function () {
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

      if (_.isNaN(ratioObj.ratio)) {
        return;
      }

      let addCommas = function (scoreNumber) {
        if (!scoreNumber || _.isNaN(scoreNumber)) {
          return '';
        } else {
          return numberWithCommas(scoreNumber);
        }
      };

      let allQuartilesString = '';
      allQuartilesString += 'Top Quartile: ';
      allQuartilesString += addCommas(allPercentilesByPin[pinName][.75]);
      allQuartilesString += '\nBottom Quartile: ';
      allQuartilesString += addCommas(allPercentilesByPin[pinName][.25]);
      let context = {
        pinName: pinName,
        allMedian: addCommas(allPercentilesByPin[pinName][.5]),
        allQuartilesString,
        allAverage: addCommas(allAveragesByPin[pinName]),
        allPlays: addCommas(allPlaysByPin[pinName])
      };

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

  };

  let updateUrl = function () {
    var urlString = '/?';

    let buildUrlString = function (playerNum) {
      if (selectedPlayers[playerNum]) {
        if (urlString.length > 2) {
          urlString += '&';
        }
        urlString += 'p'+playerNum+'='+selectedPlayers[playerNum];
      }
    };

    buildUrlString(1);
    buildUrlString(2);
    buildUrlString(3);
    buildUrlString(4);

    window.location.hash = urlString;
  };

  let loadByUrl = function () {
    let p1 = getUrlParameter('p1');
    let p2 = getUrlParameter('p2');
    let p3 = getUrlParameter('p3');
    let p4 = getUrlParameter('p4');

    if (!p1 && !p2 && !p3 && !p4) {
      return;
    }

    let setPlayer = function (playerNum, playerId) {
      if (!playerId || !AUSTIN_PLAYERS[playerId]) {
        return;
      }

      selectedPlayers[playerNum] = playerId;
      $('#player'+playerNum+'DropdownMenu').html(AUSTIN_PLAYERS[playerId] + ' <span class="caret"></span>');
    };

    setPlayer(1, p1);
    setPlayer(2, p2);
    setPlayer(3, p3);
    setPlayer(4, p4);

    rebuildTableRows();
  };

});
