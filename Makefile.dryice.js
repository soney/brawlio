#!/usr/bin/env node
var copy = require('dryice').copy;
var bio_inc = require('./include_libs');

var build_dir = "build";
var do_build_game = function() {
	copy({
		source: bio_inc.game_src
		, dest: build_dir+"/game.js"
		, filter: copy.filter.uglifyjs
	});
};


if(require.main === module) { //Called directly
	var target = process.argv[2];
	var build_game = false;

	if(target === "all") {
		build_game = true;
	} else if(target === "game") {
		build_game = true;
	} else {
		console.log("--- Brawl.IO Build Tool ---");
		console.log("");
		console.log("Options:");
		console.log("  all       Builds everything");
		console.log("  game      Builds the Brawl.IO game");
		process.exit(0);
	}

	if(build_game) {
		console.log("Building game...");
		do_build_game();
	}
	console.log("Done!");
} else { //required
	exports.build = function(callback) {
		do_build_game();
		if(callback) {
			callback();
		}
	};
}
