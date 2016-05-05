#!/bin/sh -x

PROJECT_LOCATION=$PWD
echo "Project location $PROJECT_LOCATION"
FILE_LOCATION=$(readlink -f "$0")
DIR_LOCATION=$(dirname "$FILE_LOCATION")

echo $DIR_LOCATION
echo "Done"


ARGS=`echo $@ | tr ':' ' '`
echo $ARGS
(cd $DIR_LOCATION && npm "--testfiles=\"$ARGS\"" --projectdir="\"$PROJECT_LOCATION\"" run run-selenium)
