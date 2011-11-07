define(function(require) {
	var Player = require("game/models/player");

	var Replay = function(options) {
		this.game = options.game;
		this.complete = options.complete || false;
	};

	(function() {
		this.get_map = function() { return this.game.get_map(); };
		this.add_moving_object = function(object, appears_at, disappears_at) {
			var meta_obj = {
				object: object,
				appears_at: appears_at,
				disappears_at: disappears_at
			};
			this.objects.push(meta_obj);
		};
		this.add_player = function(player) {
			this.add_moving_object(player, 0, undefined);
		};
		this.is_complete = function() {return this.complete;};
		this.get_snapshot_at = function(round) {
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
	}).call(Replay.prototype);

	return function(options){return new Replay(options);};
});
