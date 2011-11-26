#!/usr/bin/env node
var copy = require('dryice').copy;
var bio_inc = require('./include_libs');

var build_dir = "build";
var do_build_game = function() {
	copy({
		source: bio_inc.game_src
		, dest: bio_inc.game_build
		, filter: copy.filter.uglifyjs
	});
};
var do_build_home = function() {
	copy({
		source: bio_inc.home_css_src
		, dest: bio_inc.home_css_build
	});
};
var do_build_api = function() {
	copy({
		source: bio_inc.api_css_src
		, dest: bio_inc.api_css_build
	});
};


if(require.main === module) { //Called directly
	var target = process.argv[2];
	var build_game = false;
	var build_home = false;
	var build_api = false;

	if(target === "all") {
		build_game = true;
		build_home = true;
		build_api = true;
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
	if(build_home) {
		console.log("Building home CSS files...");
		do_build_home();
	}
	if(build_api) {
		console.log("Building API CSS files...");
		do_build_api();
	}
	console.log("Done!");
} else { //required
	exports.build = function(callback) {
		do_build_game();
		do_build_home();
		do_build_api();
		if(callback) {
			callback();
		}
	};
}
