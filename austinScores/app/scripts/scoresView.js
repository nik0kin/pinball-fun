
export let hidePlayerColumn = function (playerNumber) {
  $('.player' + playerNumber).hide();
};

export let showPlayerColumn = function (playerNumber) {
  $('.player' + playerNumber).show();
};

export let hidePinDescLabels = function () {
  $('.pin-description .label').hide();
};

export let showPinDescLabels = function () {
  $('.pin-description .label').show();
};
