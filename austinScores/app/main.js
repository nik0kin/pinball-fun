$(function () {
  let playerColumnHeaderTemplate = Handlebars.compile($('#player-column-header').html());
  let pinballRowTemplate = Handlebars.compile($('#score-row-template').html());

  let allScoresArray = [];
  let playersArray = [];
  let pinsArray = [];

  let scoresByPin = {}; // key is pinName, value is an array of scores
  let allAveragesByPin = {}; // key is pinName, value is average of that pin
  let allPlaysByPin = {}; // key is pinName, value is total plays of that pin

  let playerAverageScoreByPin = {}; // key is playerId, value is a {} pinName: average
  let playerLowScoreByPin = {}; // key is playerId, value is a {} pinName: low
  let playerHighScoreByPin = {}; // key is playerId, value is a {} pinName: high
  let playerPlaysByPin = {};

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
      });

      // Determine all averages & plays for each pin
      allPlaysByPin[pinName] = scoresByPin[pinName].length;
      allAveragesByPin[pinName] = Math.round(totalScore / allPlaysByPin[pinName]);

      // Determine averages of each pin for each player
      _.each(playersArray, (playerId) => {
        playerPlaysByPin[playerId][pinName] = totalPlaysByPlayer[playerId];
        playerAverageScoreByPin[playerId][pinName] = Math.round(totalScoreByPlayer[playerId] / playerPlaysByPin[playerId][pinName]);
      });

    });

    console.log('allAveragesByPin', allAveragesByPin);
    console.log('allPlaysByPin', allPlaysByPin);

    console.log('playerAverageScoreByPin', playerAverageScoreByPin);
    console.log('playerLowScoreByPin', playerLowScoreByPin);
    console.log('playerHighScoreByPin', playerHighScoreByPin);
    console.log('playerPlaysByPin', playerPlaysByPin);

    console.log('total loadtime: ' + (Date.now() - startTime) + 'ms');

    setupUI();
  });

  let setupUI = function () {

    let austinPlayers = [];
    _.each(AUSTIN_PLAYERS, (playerName, ifpaId) => {
      austinPlayers.push({playerName, ifpaId});
    });
    // sort Alphabetically
    austinPlayers = _.sortBy(austinPlayers, (playerObj) => {
      return playerObj.playerName;
    });

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
    $(".dropdown-menu li a").click(function(){
      let $dropdownButton = $(this).parents(".dropdown").find('.btn');
      $dropdownButton.html($(this).text() + ' <span class="caret"></span>');
      $dropdownButton.val($(this).data('value'));

      let columnId = $dropdownButton.attr('id').match(/player(\d)DropdownMenu/)[1];
      selectedPlayers[columnId] = $(this).attr('data-id');
      console.log('player '+columnId+': ', selectedPlayers[columnId])

      rebuildTableRows();
    });
  };

  let rebuildTableRows = function () {
    let player1 = selectedPlayers[1];
    let player2 = selectedPlayers[2];
    let player3 = selectedPlayers[3];
    let player4 = selectedPlayers[4];

    let player1PinAverageRatios = {}; // compared vs all average
    let player1PinAverageRatiosOrdered;

    if (!player1) {
      return;
    }

    // Determine player1's avg compared with AllAverage for each pin
    _.each(playerAverageScoreByPin[player1], (score, pinName) => {
      player1PinAverageRatios[pinName] = score / allAveragesByPin[pinName];
    });

    // Add rows based on pins played by player 1
    //   order them by Highest (AverageScore / AllAverageScore)
    player1PinAverageRatiosOrdered = _.map(player1PinAverageRatios, (ratio, pinName) => {
      return {pinName, ratio};
    });
    player1PinAverageRatiosOrdered = _.map(_.sortByOrder(player1PinAverageRatiosOrdered, ['ratio'], ['asc'])).reverse();

    $('tbody').html('');
    _.each(player1PinAverageRatiosOrdered, (ratioObj) => {
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

      let context = {
        pinName: pinName,
        allAverage: addCommas(allAveragesByPin[pinName]),
        allPlays: addCommas(allPlaysByPin[pinName])
      };

      let fillContext = function (num, ifpaId) {
        context['p'+num+'Average'] = addCommas(playerAverageScoreByPin[ifpaId][pinName]);
        context['p'+num+'High']  = addCommas(playerHighScoreByPin[ifpaId][pinName]);
        context['p'+num+'Low']  = addCommas(playerLowScoreByPin[ifpaId][pinName]);
        context['p'+num+'Plays']  = addCommas(playerPlaysByPin[ifpaId][pinName]);

        var ratio = playerAverageScoreByPin[ifpaId][pinName] / allAveragesByPin[pinName];
        context['p'+num+'GoodOrBad'] = (ratio > 1.25) ? 'good' : (ratio < .75) ? 'bad' : '';  
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
});
