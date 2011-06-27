(function(FistiCode, jQuery) {
	var fc = FistiCode;
	var $ = jQuery;

	var Weapon = function(attributes) {
		var self = this;

		self.attributes = $.extend({
			rate_of_fire: 0.5, //fires per round
			strength: 0.2, //HP per hit
			ammo_radius: 1, //Measured in tiles
			splash_radius: 0, //Measured in tiles,
			range: 0, //0 = no limit to range,
			speed: 50, //tiles per round
			produce_projectile: function(start_position, angle) {
				return new Projectile({
					strength: self.attributes.strength,
					radius: self.attributes.ammo_radius,
					splash_radius: self.attributes.splash_radius,
					range: self.attributes.range,
					owner: self.owner
				}, {
					position: start_position,
					velocity: self.attributes.speed,
					angle: angle,
				});
			}
		}, attributes);
		self.state = {
			last_fire: -1
		};

		this.owner = null;

		if(fc._debug) {
			this.type = "Weapon";
		}
	};

	Weapon.prototype.set_owner = function(owner) {
		this.owner = owner;
	};
	Weapon.prototype.can_fire = function() {
		var game = this.owner.game;
		var last_fire = this.state.last_fire;

		if(last_fire < 0) return true;
		var round = game.get_round();

		return round - last_fire > this.attributes.rate_of_fire;
	};

	Weapon.prototype.fire = function(angle_offset) {
		if(!this.can_fire()) {
			//throw an exception
			return;
		}

		var game = this.owner.game;

		if(!_.isNumber(angle_offset)) angle_offset = 0;
		var owner = this.owner,
			angle = this.owner.get_angle() + angle_offset,
			start_location = this.owner.get_position(),
			game = owner.game;

		var projectile = this.attributes.produce_projectile(start_location, angle);

		game.add_projectile(projectile);
		this.state.last_fire = game.get_round();
	};


	fc._create_weapon = function(attributes) {
		var weapon = new Weapon(attributes);
		return weapon;
	};

	if(fc._debug) {
		var projectile_id = 0;
	}
	var Projectile = function(attributes, state, game) {
		this.attributes = attributes;
		this.state = state;
		this.timer = fc._create_timer(this.attributes.owner.game);
		this.state.position = this.state.position.clone(); // Ensure we don't have anyone else's position

		if(fc._debug) {
			this.type = "Projectile";
			this.id = projectile_id++;
		}
	};
	Projectile.prototype.update = function() {
		var self = this,
			state = self.state,
			position = state.position,
			timer = self.timer;

		var rounds_elapsed = timer.reset("position");

		var distance = self.get_velocity() * rounds_elapsed;
		var angle = self.get_angle();

		var distance_x = Math.cos(angle)*distance;
		var distance_y = Math.sin(angle)*distance;

		self.state.position.add(distance_x, distance_y);
	};
	Projectile.prototype.get_radius = function() {
		return this.attributes.radius;
	};
	Projectile.prototype.get_position = function() {
		return this.state.position;
	};
	Projectile.prototype.get_velocity = function() {
		return this.state.velocity;
	};
	Projectile.prototype.get_angle = function() {
		return this.state.angle;
	};

})(FistiCode, jQuery);
