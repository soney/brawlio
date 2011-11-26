(function(BrawlIO) {
	var _ = BrawlIO._;

	var Team = function(options) {
		this.name = options.name;
		this.id = options.id;
		var self = this;
		this.players = _.map(options.players, function(player_options, index) {
			return BrawlIO.create("player", _.extend({number: index, team: self}, player_options));
		});
	};

	(function(my) {
		var proto = my.prototype;
		proto.is_alive = function() {
			var players = this.get_players();
			var i, len = players.length;
			for(i = 0; i<len; i++) {
				if(players[i].is_alive()) { return true; }
			}
			return false;
		};
		proto.is_dead = function() { return !this.is_alive(); };
		proto.get_players = function() { return this.players; };
		proto.num_players = function() { return this.get_players().length; };
		proto.get_id = function() { return this.id; };
		proto.set_id = function(id) { this.id = id; };
		proto.get_name = function(){return this.name;};
	}(Team));

	BrawlIO.define_factory("team", function(options) {
		return new Team(options);
	});
}(BrawlIO));