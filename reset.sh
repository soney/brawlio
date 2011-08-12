#!/bin/sh

cd vendor/node-sqlite3;./configure;make;cd ../..;npm install socket.io;node server/db_initialize.js
