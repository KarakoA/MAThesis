#!/bin/bash

TODAY=`date +"%m-%d-%y"`
cd ..
OUT_PATH=`pwd`/results/$TODAY
mkdir -p $OUT_PATH
echo "Output Path:"
echo $OUT_PATH

TEST_FILES_PATH=`pwd`/src/test-files/
TEST_FILES=`ls -p $TEST_FILES_PATH`


for FILE in $TEST_FILES
do
OUT_PATH_FILE=$OUT_PATH/$FILE
echo "Creating directory..." $OUT_PATH_FILE
mkdir -p $OUT_PATH_FILE
#//touch $OUT_PATH_FILE/data.json

#echo $OUT_PATH_FILE
echo "Executing..." npm run generate -- $TEST_FILES_PATH/$FILE $OUT_PATH_FILE/data.json '>' $OUT_PATH_FILE/scenarios.log
npm run generate -- $TEST_FILES_PATH/$FILE $OUT_PATH_FILE/data.json > $OUT_PATH_FILE/scenarios.log
cp src/index.html $OUT_PATH_FILE/index.html
echo 
done
echo "Done"
cd scripts