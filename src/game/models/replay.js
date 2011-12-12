(function(BrawlIO) {
	var _ = BrawlIO._;
	var Replay = function(options) {
		this.game = options.game;
		this.complete = options.complete || false;
		this.game_events = [];
		this.game_states = [];
		this.last_round = 0;
		BrawlIO.make_listenable(this);
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
		proto.is_complete = function() { return this.complete;};
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

		proto.push_game_state = function(game_state) {
			this.game_states.push(game_state);
		};

		proto.get_last_round = function() {
			return this.last_round;
		};
		proto.set_winner = function(winner) {
			this.winner = winner;
		};
		proto.get_winner = function() {
			return this.winner;
		};
		proto.get_round_limit = function() {
			return this.game.get_round_limit();
		};
		proto.get_max_rounds = function() {
			if(this.is_complete()) {
				return this.get_last_round();
			} else {
				return this.get_round_limit();
			}
		};
		proto.mark_complete = function(winner) {
			this.complete = true;
			this.set_winner(winner);
			this.emit({
				type: "complete"
			});
		};
		proto.set_last_round = function(round) {
			this.last_round = round;
			this.emit({
				type: "last_round_changed"
				, last_round: this.last_round
			});
		};
	}(Replay));


	BrawlIO.define_factory("replay", function(options) {
		return new Replay(options);
	});
}(BrawlIO));
