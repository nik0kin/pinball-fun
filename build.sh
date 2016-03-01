#!/bin/bash

# This script builds everything thats needed
#   and moves it to the dist directory.
#   Then it is ready to be moved to a web server.

rm -rf dist/; mkdir dist/

cp -r public/* dist/

#./buildRankings.sh
#cp -r austinRankings dist/rankings

(cd austinScores && broccoli build dist/)
mv austinScores/dist/ dist/scores/ 

(cd jamGrouper && node ./generateTuesdayJamSeeds && broccoli build dist/)
mv jamGrouper/dist/ dist/jamGrouper/
