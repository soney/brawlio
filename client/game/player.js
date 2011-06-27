(function(FistiCode, jQuery) {
	var fc = FistiCode;
	var $ = jQuery;

	var Player = function(attributes, state) {
		this.attributes = $.extend({
			radius: 4, //Radius in tiles
			movement_speed: 10.0, //Tiles per round
			rotation_speed: 90*Math.PI/180.0, //Radians per round
			max_health: 10 //Maximum health
		}, attributes);

		this.state = $.extend({
			health: this.attributes.max_health,
			location: fc._create_point(0,0),
			angle: 0*Math.PI/180.0,
			actions: [],
			weapon: null
		}, state);

		this.game = null;
		this.team = null;
		this.timer = null;
		this.id = null;

		if(this.state.weapon!==null) {
			this.state.weapon.set_owner(this);
		}

		if(fc._debug) {
			this.type = "Player";
		}
	};
	fc._create_player = function(attributes, state) {
		var player = new Player(attributes, state);
		return player;
	};

	Player.prototype.join_team = function(team) {
		this.team = team;
	};

	Player.prototype.join_game = function(game) {
		this.game = game;
		this.timer = fc._create_timer(this.game);
	};

	Player.prototype.jump_to = function(location) {
		this.state.location.set(location);
	};

	Player.prototype.set_action = function(action) {
		var self = this,
			action_type = action.type,
			state = self.state,
			actions = state.actions;

		if(action_type == fc._action_types.FIRE) {
			var weapon = self.get_weapon();
			if(weapon === null) {
				//throw some error
			}
			return weapon.fire();
		}


		var new_actions = _.filter(actions, function(action) {
			return action.type !== action_type;
		});
		new_actions.push(action);
		self.state.actions = new_actions;
	};

	Player.prototype.get_actions_of_type = function(type) {
		var self = this,
			state = self.state,
			actions = state.actions;

		var filtered_actions = _.filter(actions, function(action) {
			return action.is_type(type);
		});
		return filtered_actions;
	};

	Player.prototype.update = function() {
		this.update_position();
		this.update_angle();
	};

	Player.prototype.update_position = function() {
		var self = this,
			state = self.state,
			location = state.location,
			timer = self.timer,
			movement_actions = self.get_actions_of_type(fc._action_types.MOVE);

		var rounds_elapsed = timer.reset("position");
		if(!_.isEmpty(movement_actions)) {
			var angle = self.get_angle();
			var cos_angle = Math.cos(angle);
			var sin_angle = Math.sin(angle);
			var distance = rounds_elapsed * self.get_movement_speed();

			_.forEach(movement_actions, function(movement_action) {
				var movement_type = movement_action.subtype;
				var horizontal_motion = 0,
					vertical_motion = 0;
				if(movement_type === fc._movement_types.FORWARD) {
					horizontal_motion = cos_angle * distance;
					vertical_motion = sin_angle * distance;
				}
				else if(movement_type === fc._movement_types.BACKWARD) {
					horizontal_motion = -cos_angle * distance;
					vertical_motion = -sin_angle * distance;
				}
				else if(movement_type === fc._movement_types.LEFT) {
					horizontal_motion = -sin_angle * distance;
					vertical_motion = -cos_angle * distance;
				}
				else if(movement_type === fc._movement_types.RIGHT) {
					horizontal_motion = sin_angle * distance;
					vertical_motion = cos_angle * distance;
				}

				location.add(horizontal_motion, vertical_motion);
			});
		}

		return location;
	};

	Player.prototype.update_angle = function() {
		var self = this,
			state = self.state,
			timer = self.timer,
			rotation_actions = self.get_actions_of_type(fc._action_types.ROTATE);

		var rounds_elapsed = timer.reset("angle");
		if(!_.isEmpty(rotation_actions)) {
			var distance = rounds_elapsed * self.get_rotation_speed();
			_.forEach(rotation_actions, function(rotation_action) {
				var rotation_type = rotation_action.subtype;
				if(rotation_type === fc._rotation_types.CLOCKWISE) {
					state.angle+=distance;
				}
				else if(rotation_type == fc._rotation_types.COUNTERCLOCKWISE) {
					state.angle-=distance;
				}
			});
		}
		return state.angle;
	};

	Player.prototype.get_position = function() {
		return this.state.location;
	};
	Player.prototype.get_angle = function() {
		return this.state.angle;
	};
	Player.prototype.get_radius = function() {
		return this.attributes.radius;
	};
	Player.prototype.get_weapon = function() {
		return this.state.weapon;
	};

	Player.prototype.get_health = function() {
		return this.state.health;
	};
	Player.prototype.get_max_health = function() {
		return this.attributes.max_health;
	};
	Player.prototype.get_movement_speed = function() {
		return this.attributes.movement_speed;
	};
	Player.prototype.get_rotation_speed = function() {
		return this.attributes.rotation_speed;
	};
})(FistiCode, jQuery);
