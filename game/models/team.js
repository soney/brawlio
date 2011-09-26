define(['../constants', './player'], function(Constants, Player) {
	var Team = function(options) {
		this.code = options.code;
		this.players = [];
		for(var i = 0; i<Constants.TEAM_SIZE; i++) {
			var player = new Player({
				number: i+1
				, team: this
				, code: this.code
			});

			this.players.push(player);
		}
		this.id = options.id;
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

	return Team;
});
