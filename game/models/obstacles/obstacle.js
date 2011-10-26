define(['game/geometry/paths/movement_path'], function(create_movement_path) {
	var StaticObstacle = function(options) {
		this.inverted = options.inverted;
	};

	(function(my) {
		var proto = my.prototype;
		//If will not touch, return false
		//Otherwise, return the delta t until it will touch
		proto.will_touch = function(moving_object) {
			return false;
		};
		proto.touching = function(moving_object_state, round) {
			return false;
		};
		proto.constrain_path = function(path, moving_object, round) {
			return {path: create_movement_path({}, path), constrained_until: undefined};
		};
	})(StaticObstacle);

	return StaticObstacle;
});
