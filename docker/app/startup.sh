#!/bin/sh

cd /data

if [ ! -f config/database.json ]; then
  cp docker/app/config/database.json config/database.json
fi

npm install
npm run watch
