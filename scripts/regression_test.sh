#!/bin/bash

OUT_PATH=${INIT_CWD}/resources/output
#./scripts/generate-results.sh $OUT_PATH
DIFF_WC=$(git diff -- $OUT_PATH | wc -l | awk '{print $1}')

if [[ $DIFF_WC -eq 0 ]]
then
  exit 0
else
  echo $OUT_PATH has changed!
  git diff $OUT_PATH &
  exit 1
fi