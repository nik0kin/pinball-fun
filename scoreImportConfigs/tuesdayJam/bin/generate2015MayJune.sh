#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P ); cd "$parent_path" # http://stackoverflow.com/questions/24112727/shell-relative-paths-based-on-file-location-instead-of-current-working-director

node ../../../scoreImporters/jamSheetsImporter 1rYzWKRbl1DTlyzn9AhSKo5f4onh01jnbFZqK1_wDaIM "Tuesday Jam May-June 2015" ../../../austinScores/rawScores 0 ../config/2015MayJune.json [4,4,4]
