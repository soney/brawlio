define(['game/models/obstacles/map_boundary_obstacle'], function(MapBoundaryObstacle) {
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
		this.obstacles = [
			new MapBoundaryObstacle({
				width: this.get_width()
				, height: this.get_height()
			})
		];
	};

	(function(my) {
		var proto = my.prototype;

		proto.get_width = function() { return this.attributes.width; };
		proto.get_height = function() { return this.attributes.height; };
		proto.get_start_positions = function() {
			return this.attributes.start_positions;
		};
		proto.get_next_collision = function(moving_object) {
			var collision_times = this.obstacles.map(function(obstacle) {
				return obstacle.will_touch(moving_object);
			}).filter(function(collision_time) {
				return collision_time !== false;
			});

			if(collision_times.length === 0) {
				return false;
			} else {
			}
		};
	})(Map);

	return Map;
});
