import {initDropdown} from './bootstrapUtils';

import {generateAllStatistics} from './statistics';
import {rebuildTableRows} from './scoresdb';

export let scoreFilters = {
  extraBalls: -1,  // -1=any, 1=1, 2=2
};

export let pinFilters = {
  makes: {bally:true,dataeast:true,gottlieb:true,sega:true,stern:true,williams:true},
  yearStart: 1950,
  yearEnd: 2050,
};

export let initFilters = function () {
  // init Extra Ball filter
  initDropdown('extraBallFilterDropdown', function (text, value) {
    let filterValue;
    if (text === 'Any') {
      filterValue = -1;
    } else {
      filterValue = Number(text);
    }

    // don't recompute stats if the filter didnt change
    if (filterValue === scoreFilters.extraBalls) {
      return;
    }
    scoreFilters.extraBalls = filterValue;

    generateAllStatistics();
    rebuildTableRows();
  });

  // init make filter
  $('.form-group.make-form .checkbox-inline').click(function () {
    let $checkbox = $(this).find('input');
    let make = $checkbox.prop('value');
    let isChecked = $checkbox.prop('checked');

    pinFilters.makes[make] = isChecked;

    rebuildTableRows();
  });

  // init year filter
  $('#startYearFilter').on('change', function () {
    let yearValue = Number(this.value);
    if (_.isNaN(yearValue)) yearValue = 1950;

    pinFilters.yearStart = yearValue;

    rebuildTableRows();
  });
  $('#endYearFilter').on('change', function () {
    let yearValue = Number(this.value);
    if (_.isNaN(yearValue)) yearValue = 2050;

    pinFilters.yearEnd = yearValue;

    rebuildTableRows();
  });
};
