define(['game/geometry/paths/movement_path'], function(create_movement_path) {
	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};
	var MovingObjectState = function(options) {
		this.path = options.path;
		this.specified_path = options.specified_path;
		this.valid_from = options.valid_from;
		this.valid_to = undefined;
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(delta_t) {
			return this.path.get_position(delta_t);
		};
		proto.delta_t_until_at = function(x,y,from_t) {
			return this.path.delta_t_until_at(x,y,from_t);
		};
		proto.set_valid_to = function(to) {
			this.valid_to = to;
		};
		proto.valid_at = function(time) {
			return time >= this.valid_from && (this.valid_to === undefined ||
												time < this.valid_to);
		};
		proto.get_valid_from = function() {
			return this.valid_from;
		};
	})(MovingObjectState);

	var create_movement_state = function(options, based_on) {
		based_on = based_on || {};

		var round = options.round || 0;
		var moving_object = options.moving_object;
		var touching = options.touching;

		var specified_path = create_movement_path(options, based_on.specified_path);
		var path = create_movement_path(options, based_on.specified_path);
		touching.forEach(function(touch_info) {
			var obstacle = touch_info.obstacle;
			path_info = obstacle.constrain_path(path, moving_object, round);
			path = path_info.path;
		});

		var state = new MovingObjectState({
			specified_path: specified_path
			, path: path
			, valid_from: round
		});
		return state;
	};

	return create_movement_state;
});
