#!/usr/bin/env node

var BrawlIOServer = require(__dirname+'/server/main');

function isRoot() { return process.getuid() == 0; }

var port = 8000;
var dev = process.argv[2] === "dev";
var production = process.argv[2] === "production";

var options = {};

if(dev) {
	options.check_invite = false;
	options.auto_login = true;
} else if(production) {
	options.check_invite = true;
	options.auto_login = false;
	port = 80;
}

var bio = new BrawlIOServer(options);
bio.start(__dirname, port, "Good times to be had at localhost:"+port);
