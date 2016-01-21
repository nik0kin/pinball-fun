#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P ); cd "$parent_path" # http://stackoverflow.com/questions/24112727/shell-relative-paths-based-on-file-location-instead-of-current-working-director

scriptPath="../../../scoreImporters/jamSheetsImporter"
googleSheetsId="1_8G_77BnXDgh-bynFwn7lJV7-KjVEisRLwCY5rElhvc"
dataName="Tuesday Jam January 2016"
savePath="../../../austinScores/rawScores"
extraBalls="0"
configPath="../config/2016January.json"
gamesTotal="[5,5,5]"

node $scriptPath $googleSheetsId "$dataName" $savePath $extraBalls $configPath $gamesTotal
