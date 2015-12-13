var path = require('path');
var Q = require('q');
var _ = require('lodash');

var fsUtils = require('../lib/fsUtils');

var matchplayJsonExportPath = process.argv[2];
var configPath = process.argv[3];
var dataName = process.argv[4]
var savePath = path.join(process.cwd(), process.argv[5], (dataName + '.json').replace(/ /g, '_'));

var defaultExtraBalls = 0;

var matchplayJson;
var configJson;

var pinsByArenaName = {}; // from config
var pinsByArenaId = {};

var playersByPlayerId = {}; // key: matchplay.events player_id

var scoreJsonArray = [];

Q()
  .then(function () {
    return fsUtils.readFileQ(matchplayJsonExportPath)
      .then(function (data) {
        matchplayJson = JSON.parse(data);
        if (!matchplayJson) throw 'matchplayJson null';
      });
  })
  .then(function () {
    return fsUtils.readFileQ(configPath)
      .then(function (data) {
        configJson = JSON.parse(data);
        if (!configJson) throw 'configJson null';
      });
  })
  .then(function () {
    // parse players
    _.each(matchplayJson.players, function (player) {
      if (!player.ifpa_id) {
        console.log('missing ifpa id:', player);
        return;
      }
      playersByPlayerId[player.player_id] = {ifpaId: player.ifpa_id}
    });

    // parse pins
    _.each(configJson.pins, function (pin, arenaName) {
      pinsByArenaName[arenaName] = {
        name: arenaName,
        id: pin.id,
        ipdbId: pin.ipdbId
      };
    });
    _.each(matchplayJson.arenas, function (arena) {
      pinsByArenaId[arena.arena_id] = pinsByArenaName[arena.name];
    });

    _.each(matchplayJson.rounds, function (round) {
      _.each(round.games, function (game) {
        var arenaId = game.arena_id;

        _.each(game.results, function (result) {
          var resultPinInfo = pinsByArenaId[arenaId];

          var scoreJson = {
            playerIfpaId: playersByPlayerId[result.player_id].ifpaId,
            pinName: resultPinInfo.name,
            pinId: resultPinInfo.id,
            pinIpdbId: resultPinInfo.ipdbId,
            score: Number(result.score),
            extraBalls: defaultExtraBalls
          };

          scoreJsonArray.push(scoreJson);
        });
      });
    })
  })
  .then(function () {
    return fsUtils.writeJsonFileQ(savePath, scoreJsonArray)
      .then(function () {
        console.log('successfully saved to ' + savePath);
      });
  })
  .fail(function (error) {
    console.log('Error: ', error);
    console.log(error.stack);
  });
