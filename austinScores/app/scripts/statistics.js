import {findPercentile} from "./utils";

import {mapToIpdbId} from "./pins";
import {scoreFilters, playerFilters} from './filters';

const DEBUG = true;

const PERCENTILES = [.25, .5, .75];


export let allScoresArray = [];
export let playersArray = [];
export let pins = {}; // key is pinIpdb
export let numOfGamesPlayedByPlayer = {}; // key is playerId, value is num of total games played by that player

export let scoresByPin = {}; // key is pinIpdb, value is an array of scores
export let allAveragesByPin = {}; // key is pinIpdb, value is average of that pin
export let allPlaysByPin = {}; // key is pinIpdb, value is total plays of that pin
export let allPercentilesByPin = {}; // key is pinIpdb, value is an object of percentiles

export let filteredScoresByPin = {}; // // key is pinIpdb, value is an array of scores, scores passed all the filters

export let playerScoresByPin = {}; // key is playerId, value is {pinIpdb : [array of scores]} 
export let playerAverageScoreByPin = {}; // key is playerId, value is a {} pinIpdb: average
export let playerLowScoreByPin = {}; // key is playerId, value is a {} pinIpdb: low
export let playerHighScoreByPin = {}; // key is playerId, value is a {} pinIpdb: high
export let playerPlaysByPin = {};
export let playerPercentilesByPin = {};


export function initStatistics () {
  // load all the json into one array
  _.each(RAW_PINBALL_SCORES, (rawArray) => {
    // http://stackoverflow.com/questions/9650826/append-an-array-to-another-array-in-javascript
    allScoresArray.push.apply(allScoresArray, rawArray);
  });

  // Determine which pins and which players
  _.each(allScoresArray, (score) => {
    var pinIpdb = score.pinIpdbId || mapToIpdbId[score.pinName];
    if (!pinIpdb) {
      console.log('missing map to pinIpdb for: ', score);
      return;
    }
    if (!pins[pinIpdb]) {
      pins[pinIpdb] = {};
    }

    if (!numOfGamesPlayedByPlayer[score.playerIfpaId]) {
      // on first occurance of playerIfpaId
      numOfGamesPlayedByPlayer[score.playerIfpaId] = 0;
      playersArray = _.union(playersArray, [score.playerIfpaId]);
    }
    numOfGamesPlayedByPlayer[score.playerIfpaId]++;

    // create an array for the scoresByPin map
    if (!scoresByPin[pinIpdb]) {
      scoresByPin[pinIpdb] = [];
    }

    // add Score to scoresByPin map
    scoresByPin[pinIpdb].push(score);
  });

  if (DEBUG) {
    console.log(_.keys(pins).length + ' pins');
    console.log(playersArray.length + ' players');
    console.log('pins', pins);
    console.log('playersArray', playersArray);
    console.log('numOfGamesPlayedByPlayer', numOfGamesPlayedByPlayer);
  }

  generateAllStatistics();
};

var getPercentilesFromScores = function (arrayOfScoreObjects) {
  var scoresArray = _.map(arrayOfScoreObjects, (scoreObject) => scoreObject.score);
  var obj = {};
  _.each(PERCENTILES, (percentile) => {
    obj[percentile] = findPercentile(scoresArray, percentile);
  });
  return obj;
};

export let generateAllStatistics = function () {
  _.each(playersArray, (playerId) => {
    playerAverageScoreByPin[playerId] = {};
    playerLowScoreByPin[playerId] = {};
    playerHighScoreByPin[playerId] = {};
    playerPlaysByPin[playerId] = {};
    playerScoresByPin[playerId] = {};
    playerPercentilesByPin[playerId] = {};
  });

  filteredScoresByPin = {};

  // Determine averages
  _.each(pins, (obj, pinIpdb) => {
    let totalScore = 0;
    let totalScoreByPlayer = {};
    let totalPlaysByPlayer = {};

    _.each(scoresByPin[pinIpdb], (score) => {
      // skip score, if filters apply
      if (scoreFilters.extraBalls !== -1 && score.extraBalls != scoreFilters.extraBalls) {
        return;
      }

      // might be a timezone bug here...
      // EFF creating a lot of moment() objects here
      let isInDateRange = moment(score.date).isBetween(scoreFilters.startDate, scoreFilters.endDate);
      if (!isInDateRange) {
        return;
      }

      let gamesPlayed = numOfGamesPlayedByPlayer[score.playerIfpaId];
      if (gamesPlayed < playerFilters.minimumGamesPlayed || gamesPlayed > playerFilters.maximumGamesPlayed) {
        return;
      }

      totalScore += score.score;

      if (!totalScoreByPlayer[score.playerIfpaId]) {
        totalScoreByPlayer[score.playerIfpaId] = 0;
        totalPlaysByPlayer[score.playerIfpaId] = 0;
        playerLowScoreByPin[score.playerIfpaId][pinIpdb] = score.score;
        playerHighScoreByPin[score.playerIfpaId][pinIpdb] = score.score;
        playerScoresByPin[score.playerIfpaId][pinIpdb] = [];
      }
      totalScoreByPlayer[score.playerIfpaId] += score.score;
      totalPlaysByPlayer[score.playerIfpaId]++;

      if (!filteredScoresByPin[pinIpdb]) {
        filteredScoresByPin[pinIpdb] = [];
      }
      filteredScoresByPin[pinIpdb].push(score);

      // check for a players lowest/highest on each pin
      if (score.score < playerLowScoreByPin[score.playerIfpaId][pinIpdb]) {
        playerLowScoreByPin[score.playerIfpaId][pinIpdb] = score.score;
      }
      if (score.score > playerHighScoreByPin[score.playerIfpaId][pinIpdb]) {
        playerHighScoreByPin[score.playerIfpaId][pinIpdb] = score.score;
      }

      // add Score to playerScoresByPin
      playerScoresByPin[score.playerIfpaId][pinIpdb].push(score);
    });

    // Determine all averages & plays for each pin
    allPlaysByPin[pinIpdb] = filteredScoresByPin[pinIpdb].length;
    allAveragesByPin[pinIpdb] = Math.round(totalScore / allPlaysByPin[pinIpdb]);

    // Determine percentiles for all pins
    allPercentilesByPin[pinIpdb] = getPercentilesFromScores(filteredScoresByPin[pinIpdb]);

    // Determine averages & percentiles of each pin for each player
    _.each(playersArray, (playerId) => {
      playerPlaysByPin[playerId][pinIpdb] = totalPlaysByPlayer[playerId];
      playerAverageScoreByPin[playerId][pinIpdb] = Math.round(totalScoreByPlayer[playerId] / playerPlaysByPin[playerId][pinIpdb]);

      playerPercentilesByPin[playerId][pinIpdb] = getPercentilesFromScores(playerScoresByPin[playerId][pinIpdb]);
    });

  });

  if (DEBUG) {
    console.log('allAveragesByPin', allAveragesByPin);
    console.log('allPlaysByPin', allPlaysByPin);

    console.log('playerAverageScoreByPin', playerAverageScoreByPin);
    console.log('playerLowScoreByPin', playerLowScoreByPin);
    console.log('playerHighScoreByPin', playerHighScoreByPin);
    console.log('playerPlaysByPin', playerPlaysByPin);
    console.log('playerPercentilesByPin', playerPercentilesByPin);
  }
};
