var Brawl = require('../game/brawl');
var Map = require('../game/models/map');
var Team = require('../game/models/team');

var map = new Map();
var my_team = new Team({
	code: " player.turnRight(); game.onRound(function() { player.stopTurning(); var fire = player.fire; for(var i = 5; i<30; i++) { game.onRound(fire, i); } }, 4.8);"
	, id: 0
});

var other_team = new Team({
	code: ""
	, id: 1
});

for(var i = 0; i<1; i++) {
	var brawl = new Brawl({
		teams: [my_team, other_team]
		, map: map
		, round_limit: 10
	});

	brawl.run();
}
