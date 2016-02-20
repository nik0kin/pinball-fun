import {initDropdown} from './bootstrapUtils';

import {generateAllStatistics} from './statistics';
import {rebuildTableRows} from './scoresdb';

let allTimeRange = [moment().subtract(50, 'years'), moment().add(50, 'years')];

export let scoreFilters = {
  extraBalls: -1,  // -1=any, 1=1, 2=2
  startDate: allTimeRange[0],
  endDate: allTimeRange[1],
};

export let pinFilters = {
  makes: {bally:true,dataeast:true,gottlieb:true,sega:true,stern:true,williams:true,jerseyjack:true},
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

  // init date range filter
  let daterangeSelectedCallback = function (start, end) {
    $('#scoreDateRange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
    scoreFilters.startDate = start;
    scoreFilters.endDate = end;

    generateAllStatistics();
    rebuildTableRows();
  };
  daterangeSelectedCallback(allTimeRange[0], allTimeRange[1]);

  $('#scoreDateRange').daterangepicker({
      ranges: {
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
        'Last 3 Months': [moment().subtract(3, 'month'), moment()],
        'All Time': allTimeRange
      }
  }, daterangeSelectedCallback);

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
