define(function(require) {
	require("vendor/underscore");
	var make_listenable = require("game/util/listenable");
	var MovingObject = function(options) {
		this.shape = options.shape;
		this.x0 = options.x0;
		this.y0 = options.y0;
		this.theta0 = options.theta0;
		var translational_velocity = _.extend({speed: 0, angle: 0}, options.translational_velocity);
		var rotational_velocity = options.rotational_velocity || 0;
		this.state = {
			translational_velocity: translational_velocity
			, rotational_velocity: rotational_velocity
		};
		make_listenable(this);
		this.type = options.type;
	};

	(function(my) {
		var proto = my.prototype;
		proto.set_velocity = function(speed, angle, round) {
			this.state.translational_velocity.speed = speed;
			this.state.translational_velocity.angle = angle;
			this.emit({type: "state_change", round: round, change_type: "Set Translational Velocity"});
		};
		proto.set_rotation_speed = function(speed, round) {
			this.state.rotational_velocity = speed;
			this.emit({type: "state_change", round: round, change_type: "Set Rotational Velocity"});
		};
		proto.get_shape = function() {
			return this.shape;
		};
		proto.get_state = function() {
			return _.clone(this.state);
		};
		proto.is = function(type) {
			return this.type === type;
		};
		proto.get_next_event = function(with_moving_object) {
			return false;
		};
		proto.restrict_path = function(moving_object, path) {
			return path;
		};
		proto.is_touching = function(moving_object) {
			return false;
		};
	})(MovingObject);

	return MovingObject;
});
