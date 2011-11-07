define(function(require) {
	var StaticObstacle = function(options) {
		this.inverted = options.inverted;
	};

	(function(my) {
		var proto = my.prototype;
		//If will not touch, return false
		//Otherwise, return the delta t until it will touch
		proto.next_touch_event = function(moving_object, moving_object_state) {
			return false;
		};
		proto.touching = function(moving_object_state, round) {
			return false;
		};
		proto.constrain_path = function(path, moving_object, round) {
			return {path: path, constrained_until: undefined};
		};
	})(StaticObstacle);

	return StaticObstacle;
});
