(function(FistiCode, jQuery) {
	var fc = FistiCode;
	var $ = jQuery;

	var get_info = 00;
	var fire = 01;

	var stop_moving = 10;
	var move_forward = 11;
	var move_backward = 12;
	var move_left = 13;
	var move_right = 14;

	var stop_rotating = 20;
	var rotate_clockwise = 21;
	var rotate_counter_clockwise = 22;


	var PlayerController = function(player, game) {
		this.__ask = function(command, options) {
			if(command === move_forward) {
				var action = fc._create_action(fc._action_types.MOVE, fc._movement_types.FORWARD, options);
				return player.set_action(action);
			}
			else if(command === move_backward) {
				var action = fc._create_action(fc._action_types.MOVE, fc._movement_types.BACKWARD, options);
				return player.set_action(action);
			}
			else if(command === move_left) {
				var action = fc._create_action(fc._action_types.MOVE, fc._movement_types.LEFT, options);
				return player.set_action(action);
			}
			else if(command === move_right) {
				var action = fc._create_action(fc._action_types.MOVE, fc._movement_types.RIGHT, options);
				return player.set_action(action);
			}
			else if(command === stop_moving) {
				var action = fc._create_action(fc._action_types.MOVE, fc._movement_types.NONE, options);
				return player.set_action(action);
			}

			else if(command === rotate_clockwise) {
				var action = fc._create_action(fc._action_types.ROTATE, fc._rotation_types.CLOCKWISE, options);
				return player.set_action(action);
			}
			else if(command === rotate_counter_clockwise) {
				var action = fc._create_action(fc._action_types.ROTATE, fc._rotation_types.COUNTERCLOCKWISE, options);
				return player.set_action(action);
			}
			else if(command === stop_rotating) {
				var action = fc._create_action(fc._action_types.ROTATE, fc._rotation_types.NONE, options);
				return player.set_action(action);
			}


			else if(command === fire) {
				var weapon = player.get_weapon();
				if(weapon === null) {
					//throw some error
				}
				return weapon.fire();
			}

			else if(command === get_info) {
				var position = player.get_position();
				return {
					id: player.id,
					team_id: player.team.id,
					health: {
						current: player.get_health(),
						max: player.get_max_health()
					},
					state: {
						position: {x: position.x, y: position.y},
						angle: player.get_angle()
					},
					stats: {
						movement_speed: player.get_movement_speed(),
						rotation_speed: player.get_rotation_speed()
					}
				};
			}
		};

		if(fc._debug) {
			this.type = "PlayerController";
		}
	};

	PlayerController.prototype.moveForward = function(steps) {
		this.__ask(move_forward, {steps: steps});
	};
	PlayerController.prototype.moveBackward = function(steps) {
		this.__ask(move_backward, {steps: steps});
	};
	PlayerController.prototype.moveLeft = function(steps) {
		this.__ask(move_left, {steps: steps});
	};
	PlayerController.prototype.moveRight = function(steps) {
		this.__ask(move_right, {steps: steps});
	};
	PlayerController.prototype.stopMoving = function() {
		this.__ask(stop_moving);
	};

	PlayerController.prototype.rotateClockwise = function() {
		this.__ask(rotate_clockwise);
	};
	PlayerController.prototype.rotateCounterclockwise = function() {
		this.__ask(rotate_counter_clockwise);
	};
	PlayerController.prototype.stopRotating = function() {
		this.__ask(stop_rotating);
	};

	PlayerController.prototype.stop = function() {
		this.stopRotating();
		this.stopMoving();
	};

	PlayerController.prototype.fire = function() {
		this.__ask(fire);
	};

	PlayerController.prototype.getInfo = function() {
		return this.__ask(get_info);
	};

	fc._create_player_controller = function(player, game) {
		var pc = new PlayerController(player, game);
		return pc;
	};
})(FistiCode, jQuery);
