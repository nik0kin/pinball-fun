#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P ); cd "$parent_path" # http://stackoverflow.com/questions/24112727/shell-relative-paths-based-on-file-location-instead-of-current-working-director

matchplayJsonExport="../config/MatchPlay-977.json"
config="../config/decemberTournament.json"
dataName="Donuts Every Time Showdown December 2015"
savePath="../../../austinScores/rawScores"

node ../../../scoreImporters/matchplayEventsJsonImporter $matchplayJsonExport $config "$dataName" $savePath
