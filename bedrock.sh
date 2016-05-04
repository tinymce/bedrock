#!/bin/sh


FILE_LOCATION=$(readlink -f "$0")
DIR_LOCATION=$(dirname "$FILE_LOCATION")

echo $DIR_LOCATION
echo "Done"

#node src/js/main.js 
