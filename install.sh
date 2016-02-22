#!/bin/bash

(cd austinScores/ && npm install && bower install)
(cd jamGrouper/ && npm install && bower install)

(cd scoreImporters/ && npm install)
(cd pollIfpaForTopCityList/ && npm install)

