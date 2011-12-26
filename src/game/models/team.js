(function(BrawlIO) {
	var _ = BrawlIO._;

	var Team = function(options) {
		this.name = options.name;
		this.id = options.id;
		var self = this;
		this.players = _.map(options.players, function(player_options, index) {
			return BrawlIO.create("player", _.extend({number: index, team: self}, player_options));
		});
		this.options = options;
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
		proto.get_colors = function(){return this.options.colors;};
		proto.get_color_for_player = function(player) {
			var colors = this.get_colors();
			var i, len = this.players.length;
			for(i=0; i<len; i++) {
				if(player === this.players[i]) {
					return colors[i];
				}
			}
			return "yellow";
		};
		proto.get_win_text = function() {
			return this.options.win_text;
		};
		proto.serialize = function() { 
			return {
				win_text: this.get_win_text()
				, colors: this.get_colors()
				, id: this.get_id()
				, name: this.get_name()
				, players: _.map(this.get_players(), function(player) {
					return player.serialize()
				})
			};
		};
		my.deserialize = function(obj) {
			return new my(obj);
		};
	}(Team));

	BrawlIO.define_factory("team", function(options) {
		return new Team(options);
	});
	BrawlIO.define_factory("deserialized_team", function(obj) {
		return Team.deserialize(obj);
	});
}(BrawlIO));
