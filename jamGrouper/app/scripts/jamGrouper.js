import {TUESDAY_SEEDS} from './tuesdaySeeds';

let ifpaAPIKey = '3487e1eb25ff149d9170d0c23eb5c7e4';
let ifpaAPIBaseUrl = 'https://api.ifpapinball.com/v1/';
let ifpaSearchEndpoint = 'player/search'

let seedingFromPreviousTournaments = TUESDAY_SEEDS;
let ifpaPlayersArray = [];
let brandNewPlayersArray = [];

let $previousSeedingGroup;
let $ifpaPlayersGroup;
let $brandNewPlayersGroup;
let $ifpaSearchPlayersGroup;
let $addPlayerName;
let $jamGroups;

let previousSeedingRowTemplate;
let ifpaPlayerRowTemplate;
let brandNewPlayerRowTemplate;
let ifpaSearchPlayerRowTemplate;
let jamGroupTemplate;

let newPlayerTypeRadioValue = 'newPlayerBrandNew';

let selectedIfpaSearchPlayer;
let selectedIfpaSearchPlayerRank;

let unpresentPlayers = {}; // key is playerName, value is true if they are not present

export function init () {
  $previousSeedingGroup = $('#previousSeeding-list-group');
  $ifpaPlayersGroup = $('#ifpaPlayers-list-group');
  $brandNewPlayersGroup = $('#brandNewPlayers-list-group');
  $ifpaSearchPlayersGroup = $('#ifpaSearchPlayers-list-group');
  $addPlayerName = $('#addPlayerName-input');
  $jamGroups = $('#jamGroups');

  $('.newPlayer-radio-group input').change(function (e) {
    newPlayerTypeRadioValue = $(this).val();
    if (newPlayerTypeRadioValue === 'newPlayerIfpa') {
      refreshIfpaPlayersSearch();
      $ifpaSearchPlayersGroup.show();
    } else {
      $ifpaSearchPlayersGroup.hide();
    }
  });

  let debouncedRefreshIfpaPlayers = _.debounce(refreshIfpaPlayersSearch, 1000)
  $addPlayerName.on('keyup', () => {
    console.log($addPlayerName.val());
    if (newPlayerTypeRadioValue === 'newPlayerIfpa') {
      debouncedRefreshIfpaPlayers();
    }
  });

  $('#addPlayer-button').click(() => {
    if (newPlayerTypeRadioValue === 'newPlayerIfpa') {
      addIFPAPlayer();
    } else {
      addBrandNewPlayer();
    }
  });

  $('#groupitize-button').click(groupitize);

  initTemplates();

  initPreviousSeeding();
}

function initTemplates () {
  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
  };
  let toCompiledTemplate = function (elementId) {
    return _.template($('#' + elementId).html()) ;
  };

  previousSeedingRowTemplate = toCompiledTemplate('previousSeedingRow-template');
  ifpaPlayerRowTemplate = toCompiledTemplate('ifpaPlayerRow-template');
  brandNewPlayerRowTemplate = toCompiledTemplate('brandNewPlayerRow-template');
  ifpaSearchPlayerRowTemplate = toCompiledTemplate('ifpaSearchPlayerRow-template');
  jamGroupTemplate = toCompiledTemplate('jamGroup-template');
}

function initPreviousSeeding () {
  _.each(seedingFromPreviousTournaments, (playerName) => {
    let html = previousSeedingRowTemplate({name: playerName});
    $previousSeedingGroup.append(html);
  });
  refreshCheckboxClickHandler();
}

function addBrandNewPlayer () {
  let playerName = $addPlayerName.val();
  brandNewPlayersArray.push(playerName);

  let html = brandNewPlayerRowTemplate({name: playerName});
  $brandNewPlayersGroup.append(html);

  $addPlayerName.val('');

  refreshCheckboxClickHandler();
}

function addIFPAPlayer () {
  if (!selectedIfpaSearchPlayer) {
    return;
  }

  let player = {
    name: selectedIfpaSearchPlayer,
    rank: selectedIfpaSearchPlayerRank
  };
  ifpaPlayersArray.push(player);
  rebuildIfpaPlayersGroup();

  $addPlayerName.val('');
  $ifpaSearchPlayersGroup.html('');
  selectedIfpaSearchPlayer = undefined;

  refreshCheckboxClickHandler();
}

function clickPlayerPresentCheckbox () {
  let playerName = $(this).parent().parent().find('h4').html();
  let checked = $(this).is(':checked');

  unpresentPlayers[playerName] = !checked;
}

// dumb
function refreshCheckboxClickHandler () {
  $('.playerPresentCheckbox-div input').click(clickPlayerPresentCheckbox);
}

function rebuildIfpaPlayersGroup () {
  $ifpaPlayersGroup.html('');

  ifpaPlayersArray = _.sortBy(ifpaPlayersArray, (player) => {
    return player.rank;
  });

  _.each(ifpaPlayersArray, (player) => {
    let html = ifpaPlayerRowTemplate(player);
    $ifpaPlayersGroup.append(html);
  });
}

let lastSearchedName;
function refreshIfpaPlayersSearch () {
  let playerName = $addPlayerName.val();

  // to minimize on ajax calls
  if (playerName === lastSearchedName || playerName === '') return;
  lastSearchedName = playerName;

  $ifpaSearchPlayersGroup.html('');
  selectedIfpaSearchPlayer = undefined;

  getJSONFromIfpaSearchQ(playerName)
    .then((data) => {
      if (data.search === 'No players found') {
        $ifpaSearchPlayersGroup.html(data.search);
        return;
      }
      _.each(data.search, (searchResult) => {
        let html = ifpaSearchPlayerRowTemplate(searchResult);
        $ifpaSearchPlayersGroup.append(html);

        $('.ifpaSearchPlayerRow-div').click(clickIfpaSearchPlayerRow);
      });
    })
}

function clickIfpaSearchPlayerRow () {
  let playerName = $(this).find('h4').html();
  let rank = $(this).find('.rank').html();

  selectedIfpaSearchPlayer = playerName;
  selectedIfpaSearchPlayerRank = rank;

  $('.ifpaSearchPlayerRow-div').removeClass('active');
  $(this).addClass('active');
}

function getJSONFromIfpaSearchQ (query) {
  let url = ifpaAPIBaseUrl + ifpaSearchEndpoint + '?q=' + query + '&api_key=' + ifpaAPIKey;
  let proxyUrl = 'http://tgp.io/ba-simple-proxy.php?url=' + encodeURIComponent(url) + '&full_headers=1&full_status=1';
  return $.getJSON(proxyUrl)
    .then((data) => {
      data = data.contents;
      return data;
    })
    .fail((err) =>  {
      console.log('fail', err);
    });
}

function groupitize () {
  let seedingList = [];
  let seedI = 1;

  let numOfBigGroups = $('#numOfBigGroups-input').val();

  if (_.isNaN(Number(numOfBigGroups))) {
    numOfBigGroups = 2;
    $('#numOfBigGroups-input').val(2);
  } else {
    var n = Number(numOfBigGroups);
    if (n <= 0) {
      n = 1;
    }
    numOfBigGroups = n;
  }

  let addPlayerToSeedingList = function (playerName) {
    if (unpresentPlayers[playerName]) return;

    seedingList.push({
      name: playerName,
      seed: seedI++
    });
  };

  _.each(seedingFromPreviousTournaments, addPlayerToSeedingList);

  _.each(ifpaPlayersArray, (player) => {
    addPlayerToSeedingList(player.name);
  });

  // randomize brand new players list
  brandNewPlayersArray = _.shuffle(brandNewPlayersArray);
  _.each(brandNewPlayersArray, addPlayerToSeedingList);

  // determine amount of small groups from user or default if too low
  let minimumSmallGroupsPerSide = Number($('#numOfSmallGroupsPerSide-input').val()); // per big group
  let minimumSmallGroupSizeLimit = Math.ceil(seedingList.length / 4);
  let numOfGroups;
  if (minimumSmallGroupSizeLimit / numOfBigGroups > minimumSmallGroupsPerSide) {
    numOfGroups = minimumSmallGroupSizeLimit;
  } else {
    numOfGroups = minimumSmallGroupsPerSide * numOfBigGroups;
  }

  if (numOfGroups % numOfBigGroups != 0) {
    numOfGroups += numOfBigGroups - (numOfGroups % numOfBigGroups);
  }
  let groups = [];

  let getPlayer = function (i) {
    i--;
    if (!seedingList[i]) {
      return {name:'', seed: ''};
    }
    return seedingList[i];
  };

  _.times(numOfGroups, (i) => {
    i++;
    let player1 = getPlayer(1*numOfGroups - (numOfGroups-i));
    let player2 = getPlayer(2*numOfGroups - (numOfGroups-i));
    let player3 = getPlayer(3*numOfGroups - (numOfGroups-i));
    let player4 = getPlayer(4*numOfGroups - (numOfGroups-i));
    let newGroup = {
      groupNumber: i,
      groupLetter: ['A','B','C','D','E','F'][(i-1) % numOfBigGroups],
      player1: player1.name,
      player1Seed: player1.seed,
      player2: player2.name,
      player2Seed: player2.seed,
      player3: player3.name,
      player3Seed: player3.seed,
      player4: player4.name,
      player4Seed: player4.seed
    };
    groups.push(newGroup);
  });

  // pull seeds down (because I'm too lazy to alter the above algorithm)
  //   - pull lowest seeded players in to lower seeded groups
  //   - this disgusting code is dedicated to thomas law.
  if (seedingList.length % numOfGroups != 0) {
    // only needed if groups aren't all the same size

    // determine player position that needs the pulling
    let playerPositionToPull = Math.ceil(seedingList.length / numOfGroups);
    let playerPositionToPullKey = 'player' + playerPositionToPull;
    let lengthToPull = numOfGroups - (seedingList.length % numOfGroups);

    _.times(numOfGroups, (i) => {
      // pull them to the lowest seeded group
      let groupI = numOfGroups - i - 1;
      if (groupI <= lengthToPull - 1) return;

      // pull from the group seeded above you
      let pulledPlayer = groups[groupI-lengthToPull][playerPositionToPullKey];
      let pulledSeed = groups[groupI-lengthToPull][playerPositionToPullKey + 'Seed'];
      groups[groupI][playerPositionToPullKey] = pulledPlayer;
      groups[groupI][playerPositionToPullKey + 'Seed'] = pulledSeed;
      groups[groupI-lengthToPull][playerPositionToPullKey] = '';
      groups[groupI-lengthToPull][playerPositionToPullKey + 'Seed'] = '';
    });
  }

  $jamGroups.html('');
  _.each(groups, (group) => {
    let html = jamGroupTemplate(group);
    $jamGroups.append(html);
  });
}
