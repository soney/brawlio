(function(BrawlIO) {
	var close_to = BrawlIO.close_to;

	var MovingObjectState = function(options) {
		this.moving_object = options.moving_object;
		this.x0 = options.x0;
		this.y0 = options.y0;
		this.theta0 = options.theta0;
		this.rotational_velocity = options.rotational_velocity;
		this.translational_velocity = options.translational_velocity;

		this.specified_path = this.get_specified_path();
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_moving_object = function() { return this.moving_object; };
		proto.get_position_after = function(rounds) {
			var path = this.get_path();
			var position = path.get_position(rounds);
			return {
				x: position.x
				, y: position.y
				, theta: this.theta0 + rounds * this.get_rotational_velocity()
			};
		};
		proto.get_x0 = function() { return this.x0; };
		proto.get_y0 = function() { return this.y0; };
		proto.get_theta0 = function() { return this.theta0; };
		proto.get_rotational_velocity = function() { return this.rotational_velocity; };
		proto.get_translational_speed = function() { return this.translational_velocity.speed; };
		proto.get_translational_angle = function() { return this.translational_velocity.angle; };
		proto.get_specified_path = function() {
			var translational_speed = this.get_translational_speed();
			var rotational_velocity = this.get_rotational_velocity();
			var movement_angle;
			if(close_to(translational_speed, 0)) {
				return BrawlIO.create("stationary_path", {
					x0: this.get_x0()
					, y0: this.get_y0()
				});
			} else if(close_to(rotational_velocity, 0)) {
				movement_angle = this.get_theta0() + this.get_translational_angle();
				return BrawlIO.create("constant_velocity_line_path", {
					x0: this.get_x0()
					, y0: this.get_y0()
					, speed: this.get_translational_speed()
					, angle: movement_angle
				});
			} else {
				movement_angle = this.get_theta0() + this.get_translational_angle();
				return BrawlIO.create("constant_velocity_circle_path", {
					x0: this.get_x0()
					, y0: this.get_y0()
					, movement_angle: movement_angle
					, speed: this.get_translational_speed()
					, rotational_speed: this.get_rotational_velocity()
				});
			}
		};
		proto.set_path = function(path) {
			this.path = path;
		};
		proto.get_path = function() {
			return this.path;
		};
		proto.get_next_event = function(other_state) {
			return BrawlIO.get_next_path_path_event(this, other_state);
		};
		proto.is_touching = function(other_moving_object_state, rounds) {
			rounds = rounds || 0;
			var my_position = this.get_position_after(rounds);
			var other_position = other_moving_object_state.get_position_after(rounds);
			var x1 = my_position.x
				, y1 = my_position.y
				, x2 = other_position.x
				, y2 = other_position.y;
			return Math.sqrt( Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2) );
		};
		proto.restrict_path = function(other_moving_object_state) {
		};
		proto.serialize = function() {
			return {
				moving_object: this.get_moving_object().get_id()
				, x0: this.get_x0()
				, y0: this.get_y0()
				, theta0: this.get_theta0()
				, rotational_velocity: this.rotational_velocity
				, translational_velocity: this.translational_velocity
				, path: this.get_path().serialize()
			};
		};
	}(MovingObjectState));

	BrawlIO.define_type("MovingObjectState", MovingObjectState);
}(BrawlIO));
