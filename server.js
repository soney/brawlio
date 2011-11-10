#!/usr/bin/env node

var BrawlIOServer = require(__dirname+'/server/main');

function isRoot() { return process.getuid() == 0; }

var port = 8000;
var production = true;
if(process.argv.length === 3 && process.argv[2] === "dev") {
	production = false;
}

if(production) {
	port = 80;
}

var bio = new BrawlIOServer(production);
bio.start(__dirname, port, "Good times to be had at localhost:"+port);
/*
try {
} catch(e) {
	console.log(e.);
}
*/
