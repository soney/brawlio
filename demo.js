#!/usr/bin/env node

var BrawlIOServer = require('./server/main');

var bio = new BrawlIOServer();
bio.start(__dirname, "Good times to be had at localhost:8000");
