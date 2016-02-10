import {getUrlParameter, timesFrom1} from "./utils";

import {AUSTIN_PLAYERS} from "./austinPlayers";

import {setPlayerNameTypeaheadValue} from './scoresView';
import {selectedPlayers} from './scoresdb';

export function updateUrl () {
  var urlString = '/?';

  let buildUrlString = function (playerNum) {
    if (selectedPlayers[playerNum]) {
      if (urlString.length > 2) {
        urlString += '&';
      }
      urlString += 'p'+playerNum+'='+selectedPlayers[playerNum];
    }
  };

  timesFrom1(4, buildUrlString);

  window.location.hash = urlString;
};

export function loadByUrl () {
  let setPlayer = function (playerNum, playerId) {
    if (!playerId || !AUSTIN_PLAYERS[playerId]) {
      return;
    }

    selectedPlayers[playerNum] = playerId;
    setPlayerNameTypeaheadValue(playerNum, AUSTIN_PLAYERS[playerId]);
  };

  timesFrom1(4, (playerNum) => {
    let playerId = getUrlParameter('p'+playerNum);
    setPlayer(playerNum, playerId);
  });
};
