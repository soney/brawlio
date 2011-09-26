define(function(require, exports, module) {
	var Map = function(options) {
		if(options == null) {
			options = {};
		}
		this.attributes = {
			width: 50 //Width in tiles
			, height: 50 //Height in tiles
			, start_positions: [
				[{x: 10, y: 10, theta: 0}]
				, [{x: 40, y: 40, theta: 0}]
			]
		};
	};

	(function(my) {
		var proto = my.prototype;

		proto.get_width = function() { return this.attributes.width; };
		proto.get_height = function() { return this.attributes.height; };

		proto.check_bounds = function(old_pos, new_pos, player) {
			var rv = {x: new_pos.x, y: new_pos.y, theta: new_pos.theta};
			var radius = player.get_radius();
			var map_width = this.get_width();
			var map_height = this.get_height();

			var min_x = rv.x - radius;
			var max_x = rv.x + radius;
			var min_y = rv.y - radius;
			var max_y = rv.y + radius;

			if(min_x < 0) {
				rv.x = radius;
			} else if(max_x > map_width) {
				rv.x = map_width - radius;
			}

			if(min_y < 0) {
				rv.y = radius;
			} else if(max_y > map_height) {
				rv.y = map_height - radius;
			}
			return rv;
		};
		proto.get_start_positions = function() {
			return this.attributes.start_positions;
		};
		proto.projectile_left = function(projectile, old_pos, new_pos) {
			var map_width = this.get_width();
			var map_height = this.get_height();
			var radius = projectile.get_radius();

			var min_x = new_pos.x - radius;
			var max_x = new_pos.x + radius;
			var min_y = new_pos.y - radius;
			var max_y = new_pos.y + radius;
			return max_x <= 0 || max_y <= 0 || min_x >= map_height || min_y >= map_height;
		};
	})(Map);

	return Map;
});
