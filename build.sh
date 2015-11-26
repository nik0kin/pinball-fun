#!/bin/bash

rm -rf dist/; mkdir dist/

cp -r public/* dist/

./buildRankings.sh
cp -r austinRankings dist/rankings

(cd austinScores && broccoli build dist/)
mv austinScores/dist/ dist/scores/ 

