(function(BrawlIO) {
	var _ = BrawlIO._;
	var Replay = function(options) {
		this.game = options.game;
		this.complete = options.complete || false;
		this.game_events = [];
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_map = function() { return this.game.get_map(); };
		proto.add_moving_object = function(object, appears_at, disappears_at) {
			var meta_obj = {
				object: object,
				appears_at: appears_at,
				disappears_at: disappears_at
			};
			this.objects.push(meta_obj);
		};
		proto.is_complete = function() {return this.complete;};
		proto.get_snapshot_at = function(round) {
			var game = this.game;
			var moving_object_states = game.get_moving_object_states(round);
			var map = this.get_map();
			return {
				round: round
				, moving_object_states: moving_object_states
				, map: {
					width: map.get_width()
					, height: map.get_height()
				}
			};
		};
		proto.get_game_events = function() {
			return this.game_events;
		};
		proto.get_game_events.between = function(from_round, to_round) {
			return _.filter(this.get_game_events(), function(game_event) {
				var round = game_event.get_round();
				return round >= from_round && round < to_round;
			});
		};
		proto.push_game_event = function(game_event) {
			this.game_events.push(game_event);
		};
		proto.get_num_rounds = function() {
			return this.last_round;
		};
		proto.set_num_rounds = function(rounds) {
			this.last_round = rounds;
		};
		proto.set_winner = function(winner) {
			this.winner = winner;
		};
		proto.get_winner = function() {
			return this.winner;
		};
	}(Replay));

	BrawlIO.define_factory("replay", function(options) {
		return new Replay(options);
	});
}(BrawlIO));
