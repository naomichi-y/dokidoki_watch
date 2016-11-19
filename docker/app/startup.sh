#!/bin/sh

cd /data

if [ ! -f config/database.json ]; then
  cp config/database.json.example config/database.json
fi

npm install
gulp watch
