define(function(require, exports, module) {
	var GameConstants = {
		TEAM_SIZE: 1
		, PIXEL_TILE_RATIO: 5
		, SIM_MS_PER_ROUND: 1000
		, REPLAY_MS_PER_ROUND: 1000
		, PROJECTILE_SPEED: 20 
	};

	var Actions = {
		move_type: 0
		, move: {
			stop: 00
			, forward: 01
			, backward: 02
			, left: 03
			, right: 04
		}

		, rotate_type: 1
		, rotate: {
			stop: 10
			, clockwise: 11
			, counter_clockwise: 12
		}

		, instantaneous_type: 2
		, fire: 20
		, stop_firing: 21
		, sense: 22

		, get_type: function(action) {
			if(action<10) { return Actions.move_type; }
			else if(action<20) { return Actions.rotate_type; }
			else if(action<30) { return Actions.instantaneous_type; }
		}
	};

	exports.game_constants = GameConstants;
	exports.actions = Actions;
});
