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
	options.debug_pages = true;
	options.use_build = false;
} else if(production) {
	options.check_invite = true;
	options.auto_login = false;
	options.debug_pages = false;
	options.use_build = true;
	port = 80;
}

var bio = new BrawlIOServer(options);
bio.start(__dirname, port, "Good times to be had at http://localhost:"+port);
