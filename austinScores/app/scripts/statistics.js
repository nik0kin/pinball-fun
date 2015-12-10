import {findPercentile} from "./utils";

import * as filters from './filters';
let scoreFilters; // cyclic dependencys dont work with babel/browserify?

const DEBUG = true;

const PERCENTILES = [.25, .5, .75];


export let allScoresArray = [];
export let playersArray = [];
export let pinsArray = [];

export let scoresByPin = {}; // key is pinName, value is an array of scores
export let allAveragesByPin = {}; // key is pinName, value is average of that pin
export let allPlaysByPin = {}; // key is pinName, value is total plays of that pin
export let allPercentilesByPin = {}; // key is pinName, value is an object of percentiles

export let playerScoresByPin = {}; // key is playerId, value is {pinName : [array of scores]} 
export let playerAverageScoreByPin = {}; // key is playerId, value is a {} pinName: average
export let playerLowScoreByPin = {}; // key is playerId, value is a {} pinName: low
export let playerHighScoreByPin = {}; // key is playerId, value is a {} pinName: high
export let playerPlaysByPin = {};
export let playerPercentilesByPin = {};


export function initStatistics () {
  scoreFilters = filters.scoreFilters;

  // load all the json into one array
  _.each(RAW_PINBALL_SCORES, (rawArray) => {
    // http://stackoverflow.com/questions/9650826/append-an-array-to-another-array-in-javascript
    allScoresArray.push.apply(allScoresArray, rawArray);
  });

  // Determine which pins and which players
  let allPins = [];
  _.each(allScoresArray, (score) => {
    allPins = _.union(allPins, [score.pinName]);
    playersArray = _.union(playersArray, [score.playerIfpaId]);

    // create an array for the scoresByPin map
    if (!scoresByPin[score.pinName]) {
      scoresByPin[score.pinName] = [];
    }

    // add Score to scoresByPin map
    scoresByPin[score.pinName].push(score);
  });

  _.each(allPins, (pinName) => {
    pinsArray.push(pinName);
  });

  if (DEBUG) {
    console.log(pinsArray.length + ' pins');
    console.log(playersArray.length + ' players');
    console.log('pinsArray', pinsArray);
    console.log('playersArray', playersArray);
  }

  generateAllStatistics();
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

  // Determine averages
  _.each(pinsArray, (pinName) => {
    let totalScore = 0;
    let totalScoreByPlayer = {};
    let totalPlaysByPlayer = {};

    _.each(scoresByPin[pinName], (score) => {
      // skip score, if filters apply
      if (scoreFilters.extraBalls !== -1 && score.extraBalls != scoreFilters.extraBalls) {
        return;
      }

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