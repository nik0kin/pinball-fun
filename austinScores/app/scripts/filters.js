import {initDropdown} from './bootstrapUtils';

import {generateAllStatistics} from './statistics';
import {rebuildTableRows} from './scoresdb';

export let scoreFilters = {
  extraBalls: -1,  // -1=any, 1=1, 2=2
};

export let initFilters = function () {
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
};
