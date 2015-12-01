import {initDropdown} from './bootstrapUtils';
import {addPropertiesToObject} from './utils';

import {
  hidePlayerColumn, showPlayerColumn,
  hidePinDescLabels, showPinDescLabels
} from './scoresView';


let scope = {};

export var initSettings = function ($s) {
  addPropertiesToObject($s, scope)

  initDropdown('playerColumnsDropdown', function (text, value) {
    scope.showPlayerColumns(Number(text));
  });

  $('#hideLabelsCheckbox').click(function () {
    let isChecked = $(this).prop('checked');
    isLabelsHiden = isChecked;
    scope.applyHideLabelsSetting();
  })
};

let shownPlayerColumns = 4;
scope.applyPlayerColumnsSetting = function () {
  scope.showPlayerColumns(shownPlayerColumns);
};

scope.showPlayerColumns = function (playerNumber) {
  _.times(4, (playerNum) => {
    playerNum++; // account for playerNum starting at 0

    if (playerNumber < playerNum) {
      hidePlayerColumn(playerNum);
    } else {
      showPlayerColumn(playerNum);
    }
  });

  shownPlayerColumns = playerNumber;
};

let isLabelsHiden = false;
scope.applyHideLabelsSetting = function () {
  if (isLabelsHiden) {
    hidePinDescLabels();
  } else {
    showPinDescLabels();
  }
};
