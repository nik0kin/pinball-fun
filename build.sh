#!/bin/bash

rm -rf dist/; mkdir dist/

cp index.html favicon.ico dist/

./buildRankings.sh
cp -r austinRankings dist/rankings

(cd austinScores && broccoli build dist/)
mv austinScores/dist/ dist/scores/ 

