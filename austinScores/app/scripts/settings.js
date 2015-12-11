import {initDropdown} from './bootstrapUtils';
import {createLocalStorageObject} from './localStorageUtils';
import {timesFrom1} from './utils';

import {
  hidePlayerColumn, showPlayerColumn,
  hidePinDescLabels, showPinDescLabels
} from './scoresView';

const settingsDefaults = {
  shownPlayerColumns: 2,
  isLabelsHiden: false,
};

let settings;

export var initSettings = function () {
  settings = createLocalStorageObject(settingsDefaults);

  initDropdown('playerColumnsDropdown', function (text) {
    let numOfPlayers = Number(text);
    showPlayerColumns(numOfPlayers);
    settings.set('shownPlayerColumns', numOfPlayers);
  }, settings.get('shownPlayerColumns', Number));

  $('#hideLabelsCheckbox').click(function () {
    let isChecked = $(this).prop('checked');
    settings.set('isLabelsHiden', isChecked);
    applyHideLabelsSetting();
  });
  $('#hideLabelsCheckbox').prop('checked', settings.get('isLabelsHiden', Boolean));
};

export let applyPlayerColumnsSetting = function () {
  showPlayerColumns(settings.get('shownPlayerColumns', Number));
};

export let showPlayerColumns = function (numOfPlayers) {
  timesFrom1(4, (playerNum) => {
    if (numOfPlayers < playerNum) {
      hidePlayerColumn(playerNum);
    } else {
      showPlayerColumn(playerNum);
    }
  });
};

export let applyHideLabelsSetting = function () {
  if (settings.get('isLabelsHiden', Boolean)) {
    hidePinDescLabels();
  } else {
    showPinDescLabels();
  }
};
