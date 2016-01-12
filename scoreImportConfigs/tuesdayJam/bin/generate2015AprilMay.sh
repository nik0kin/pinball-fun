#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P ); cd "$parent_path" # http://stackoverflow.com/questions/24112727/shell-relative-paths-based-on-file-location-instead-of-current-working-director

scriptPath="../../../scoreImporters/jamSheetsImporter"
googleSheetsId="1hZgEbpta9blZeYCW3K3Rbs47CCD2g6BRbhI2G3pNOVI"
dataName="Radical Cowabunga League April-May 2015"
savePath="../../../austinScores/rawScores"
extraBalls="0"
configPath="../config/2015AprilMay.json"
gamesTotal="[4,4,4]"

node $scriptPath $googleSheetsId "$dataName" $savePath $extraBalls $configPath $gamesTotal
