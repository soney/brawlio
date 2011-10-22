define([], function() {
	var StaticObstacle = function(options) {
		this.inverted = options.inverted;
	};

	(function(my) {
		var proto = my.prototype;
		//If will not touch, return false
		//Otherwise, return the delta t until it will touch
		proto.will_touch = function(moving_object_state) {
			return false;
		};
	})(StaticObstacle);

	return StaticObstacle;
});
