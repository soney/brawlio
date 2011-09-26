define(['game/util/listenable'], function(make_listenable) {

	var Player = function(options) {
		if(options == null) {
			options = {};
		}
		this.attributes = {
			radius: 2 //Radius in tiles
			, max_movement_speed: 5.0 //Tiles per round
			, max_rotation_speed: 90*Math.PI/180.0 //Radians per round
			, max_health: 10 //Maximum health
			, max_firing_angle_offset: Math.PI/8.0 //Radians
			, shots_per_round: 1.0 //Shots per round
		};
		this.state = {
			position: {x: -1, y: -1, theta: 0}
			, velocity: {speed: 0, angle: 0, theta: 0}
			, health: this.get_max_health()
			, auto_fire: false
			, next_fireable_round: 0
			, last_update_round: 0
		};
		this.game = options.game;
		this.options = options;
		make_listenable(this);
	};

	(function(my) {
		//Utilities
		var ceil = function(x, max) {
			if(x == null) {
				return max;
			} else {
				var limited_val = Math.min(Math.abs(x), max); 
				if(x < 0) {
					return -1 * limited_val;
				} else {
					return limited_val;
				}
			}
		};
		var proto = my.prototype;
		proto.get_attributes = function() {return this.attributes;};
		proto.get_attribute = function(attr_name) { return this.attributes[attr_name]; };
		proto.set_attribute = function(attr_name, value) {this.attributes[attr_name] = value;};
		proto.get_state = function(state_name) {return this.state[state_name]; };
		proto.set_state = function(state_name, value) {this.state[state_name] = value;};

		proto.set_game = function(game) { this.game = game; };
		proto.set_id = function(id) { this.options.id = id; };
		proto.get_round = function() { return this.game.get_round(); };
		proto.get_code = function() { return this.options.code; };
		proto.get_team = function() { return this.options.team; };
		proto.get_number = function() { return this.options.number; };
		proto.get_id = function() { return this.options.id; };


		proto.serialize = function() {
			return {
				code: this.get_code()
				, number: this.get_number()
				, id: this.get_id()
			};
		};

		proto.get_radius = function() { return this.get_attribute("radius"); };

		//Health-related
		proto.get_max_health = function() { return this.get_attribute("max_health"); };
		proto.get_health = function() { return this.get_state("health"); };
		proto.is_alive = function() { return this.get_health() > 0; };
		proto.is_dead = function() { return !this.is_alive(); };
		proto.remove_health = function(amount) {
			this.set_state("health", this.get_health() - amount);
			return this.is_alive();
		};

		//Movement-related
		proto._set_x = function(x) { this.state.position.x = x; };
		proto.get_x = function() { return this.state.position.x; };
		proto._set_y = function(y) { this.state.position.y = y; };
		proto.get_y = function() { return this.state.position.y; };
		proto.get_velocity = function() {
			var speed = this.state.velocity.speed;
			var angle = this.state.velocity.angle + this.get_theta();

			return {x: speed * Math.cos(angle), y: speed*Math.sin(angle)};
		};
		proto.set_velocity = function(speed, angle) {
			this.state.velocity.speed = ceil(speed, this.get_max_movement_speed());
			this.state.velocity.angle = angle;
		};
		proto.get_max_movement_speed = function() { return this.get_attribute("max_movement_speed"); };

		//Rotation-related
		proto._set_theta = function(theta) { this.state.position.theta = theta; };
		proto.get_theta = function() { return this.state.position.theta; };
		proto.get_max_rotation_speed = function() { return this.get_attribute("max_rotation_speed"); };
		proto.get_rotation_speed = function() { return this.state.velocity.theta; };
		proto.set_rotation_speed = function(speed) {
			this.state.velocity.theta = ceil(speed, this.get_max_rotation_speed());
		};

		proto.get_position = function() {
			return {x: this.get_x()
					, y: this.get_y()
					, theta: this.get_theta()};
		};

		//Firing-related
		proto.can_fire = function() {
			var round = this.get_round();
			return round > this.get_next_fireable_round();
		};
		proto.get_next_fireable_round = function() {
			return this.get_state("next_fireable_round");
		};
		proto.set_next_fireable_round = function() {
			var round = this.get_round();
			var rounds_between_shots = 1.0/this.get_attribute("shots_per_round");
			var next_fireable_round = round + rounds_between_shots;
			this.set_state("next_fireable_round", next_fireable_round);
			return next_fireable_round;
		};
		proto.on_fire = function(options) {
			this.set_next_fireable_round();
			this.emit({
				type: "fire"
			});
		};
		proto.on_fire_fail = function(options) {
			this.emit({
				type: "fire_fail"
			});
		};
		proto.fire = function(options) {
			if(this.can_fire()) {
				this.on_fire(options);
			} else {
				this.on_fire_fail();
			}
		};

		//Update-related
		proto.get_last_update_round = function() { return this.get_state("last_update_round"); };
		proto.update_last_update_round = function() { this.set_state("last_update_round", this.get_round()); };
		proto.get_updated_position = function() {
			var delta_rounds = this.get_round() - this.get_last_update_round();
			var velocity = this.get_velocity();

			return {x: this.get_x() + velocity.x * delta_rounds
					, y: this.get_y() + velocity.y * delta_rounds
					, theta: this.get_theta() + this.get_rotation_speed() * delta_rounds };
		};
		proto.set_updated_position = function(position) {
			this._set_x(position.x);
			this._set_y(position.y);
			this._set_theta(position.theta);

			this.update_last_update_round();
		};
	})(Player);

	return Player;
});
