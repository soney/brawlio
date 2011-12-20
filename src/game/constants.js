(function() {
	var game_constants = {
		TEAM_SIZE: 1
		, PIXEL_TILE_RATIO: 5
		, SIM_MS_PER_ROUND: 400
		, REPLAY_MS_PER_ROUND: 1000
		, PROJECTILE_SPEED: 20 
		, PROJECTILE_DAMAGE: 2
		, actions: {
			move_type: 0
			, move: {
				stop: 0
				, forward: 1
				, backward: 2
				, left: 3
				, right: 4
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
		}
	};

	game_constants.actions.get_type = function(action) {
		if(action<10) { return game_constants.actions.move_type; }
		else if(action<20) { return game_constants.actions.rotate_type; }
		else if(action<30) { return game_constants.actions.instantaneous_type; }
	};
	if(this.hasOwnProperty("BrawlIO")) {
		this.BrawlIO.game_constants = game_constants;
	} else {
		this.game_constants = game_constants;
	}
}());
