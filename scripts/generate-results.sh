#!/bin/bash

TODAY=`date +"%d-%m-%y"`
cd ..

if [ $# -eq 0 ]
then
   OUT_PATH=`pwd`/results/$TODAY
else 
    OUT_PATH=$1
fi

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

echo "Executing..." npm run generate -s $TEST_FILES_PATH/$FILE $OUT_PATH_FILE/data.json '>' $OUT_PATH_FILE/scenarios.txt
npm run generate -s $TEST_FILES_PATH/$FILE $OUT_PATH_FILE/data.json > $OUT_PATH_FILE/scenarios.txt

cp src/index.html $OUT_PATH_FILE/index.html
cp $TEST_FILES_PATH/$FILE $OUT_PATH_FILE/$FILE
echo 
done
echo "Done"
cd scripts