#!/usr/bin/env node

var BrawlIOServer = require('./server/main');

var argv = process.argv;
var port = 8000;
if(argv.length === 3 && argv[2] === "production") {
	port = 80;
}
var bio = new BrawlIOServer();
bio.start(__dirname, port, "Good times to be had at localhost:"+port);
