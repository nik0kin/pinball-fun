#!/bin/bash

rm -rf dist/; mkdir dist/

cp index.html dist/

./buildRankings.sh
cp -r austinRankings dist/austinRankings

(cd austinScores && broccoli build dist/)
mv austinScores/dist/ dist/austinScores/ 

