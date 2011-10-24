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
				var touch_time = obstacle.will_touch(moving_object);
				if(touch_time === false) { return false; }
				else { return {obstacle: obstacle, time: touch_time}; }
			}).filter(function(collision_time) {
				return collision_time !== false;
			});

			var next_obstacle_collision = false;
			collision_times.forEach(function(collision) {
				if(next_obstacle_collision === false || collision.time < next_obstacle_collision.time) {
					next_obstacle_collision = collision;
				}
			});
			if(next_obstacle_collision === false) { return false; }
			else { return next_obstacle_collision.time; }
		};
	})(Map);

	return Map;
});
