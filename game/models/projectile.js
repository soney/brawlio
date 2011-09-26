define(['game/util/listenable'], function(make_listenable) {
	var Projectile = function(options) {
		if(options == null) {
			options = {};
		}

		this.attributes = {
			radius: 2 //Radius in tiles
		};
		this.state = {
			position: {x: -1, y: -1}
			, velocity: {speed: 0, angle: 0}
		};
	};

	(function(my) {
		var proto = my.prototype;

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

			return {x: this.get_x() + velocity.x * delta_rounds
					, y: this.get_y() + velocity.y * delta_rounds };
		};
		proto.set_update_position = function(position) {
			this._set_x(position.x);
			this._set_y(position.y);

			this.update_last_update_round();
		};
	})(Projectile);

	return Projectile;
});
