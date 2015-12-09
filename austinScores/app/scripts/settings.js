import {initDropdown} from './bootstrapUtils';

import {
  hidePlayerColumn, showPlayerColumn,
  hidePinDescLabels, showPinDescLabels
} from './scoresView';

export var initSettings = function () {

  initDropdown('playerColumnsDropdown', function (text, value) {
    showPlayerColumns(Number(text));
  });

  $('#hideLabelsCheckbox').click(function () {
    let isChecked = $(this).prop('checked');
    isLabelsHiden = isChecked;
    applyHideLabelsSetting();
  })
};

let shownPlayerColumns = 4;
export let applyPlayerColumnsSetting = function () {
  showPlayerColumns(shownPlayerColumns);
};

export let showPlayerColumns = function (playerNumber) {
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
export let applyHideLabelsSetting = function () {
  if (isLabelsHiden) {
    hidePinDescLabels();
  } else {
    showPinDescLabels();
  }
};
