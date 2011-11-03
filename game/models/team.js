define(function(require) {
	require("vendor/underscore");
	var create_player = require('game/models/player');

	var Team = function(options) {
		this.name = options.name;
		this.id = options.id;
		this.players = _.map(options.players, function(player_options, index) {
			return create_player(_.extend({number: index}, player_options));
		});
	};

	(function(my) {
		var proto = my.prototype;
		proto.is_alive = function() {
			var players = this.get_players();
			for(var i = 0, len = players.length; i<len; i++) {
				if(players[i].is_alive()) return true;
			}
			return false;
		};
		proto.is_dead = function() { return !this.is_alive(); };
		proto.get_players = function() { return this.players; };
		proto.num_players = function() { return this.get_players().length; };
		proto.get_id = function() { return this.id; };
		proto.set_id = function(id) { this.id = id; };
	})(Team);

	return function(options) {
		return new Team(options);
	};
});
