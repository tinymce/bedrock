#!/bin/sh -x


FILE_LOCATION=$(readlink -f "$0")
DIR_LOCATION=$(dirname "$FILE_LOCATION")

echo $DIR_LOCATION
echo "Done"

ARGS=`echo $@ | tr ':' ' '`
echo $ARGS
npm "--testfiles=\"$ARGS\"" --basedir="\"$DIR_LOCATION\"" run run-selenium
#npm --testfiles="src/test/js/browser/projects/docket/ListReaderTest.js src/test/js/browser/projects/docket/ListWriterTest.js" --basedir="\"$DIR_LOCATION\"" run run-selenium
