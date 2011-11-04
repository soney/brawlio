define(function(require) {
	require("vendor/underscore");
	var make_listenable = require("game/util/listenable");
	var MovingObject = function(options) {
		this.shape = options.shape;
		this.state = {
			translational_velocity: {speed: 0, angle: 0}
			, rotational_velocity: 0
		};
		make_listenable(this);
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
	})(MovingObject);

	return MovingObject;
});
