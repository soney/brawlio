define(['game/util/listenable'], function(make_listenable) {
	var Projectile = function(options) {
		if(options == null) {
			options = {};
		}

		this.attributes = {
			radius: 1 //Radius in tiles
			, source: options.source
		};
		this.state = {
			position: {x: -1, y: -1}
			, velocity: {speed: 0, angle: 0}
			, last_update_round: 0
		};
		this.set_game(options.game);
		this.update_last_update_round();
	};

	(function(my) {
		var proto = my.prototype;

		proto.get_state = function(state_name) {return this.state[state_name]; };
		proto.set_state = function(state_name, value) {this.state[state_name] = value;};

		proto.set_game = function(game) { this.game = game; };
		proto.get_round = function() { return this.game.get_round(); };

		proto.get_radius = function() { return this.attributes.radius; };

		proto.get_source = function() {
			return this.attributes.source;
		};

		//Movement related
		proto.get_x = function() { return this.state.position.x; };
		proto.get_y = function() { return this.state.position.y; };
		proto.get_position = function() {
			return {x: this.state.position.x
					, y: this.state.position.y };
		};
		proto.get_velocity = function() {
			var speed = this.state.velocity.speed;
			var angle = this.state.velocity.angle;

			return {x: speed * Math.cos(angle), y: speed*Math.sin(angle)};
		};

		//Update-related
		proto.get_last_update_round = function() { return this.get_state("last_update_round"); };
		proto.update_last_update_round = function() { this.set_state("last_update_round", this.get_round()); };
		proto.get_updated_position = function() {
			var delta_rounds = this.get_round() - this.get_last_update_round();
			var velocity = this.get_velocity();
			var position = this.get_position();
			return {x: position.x + velocity.x * delta_rounds
					, y: position.y + velocity.y * delta_rounds };
		};
		proto.set_position = function(position) {
			this.state.position.x = position.x;
			this.state.position.y = position.y;
			this.update_last_update_round();
		};
		proto.set_velocity = function(speed, angle) {
			this.state.velocity.speed = speed;
			this.state.velocity.angle = angle;
		};
	})(Projectile);

	return Projectile;
});
