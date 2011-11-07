define(function(require) {
	require("vendor/underscore");
	var MapBoundaryObstacle = require('game/models/obstacles/map_boundary_obstacle');

	var Map = function(options) {
		if(options == null) {
			options = {};
		}
		this.attributes = {
			width: 50 //Width in tiles
			, height: 50 //Height in tiles
			, start_positions: [
				[{x: 47, y: 10, theta: 0}]
				, [{x: 5, y: 40, theta: 0}]
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
		proto.get_next_event = function(moving_object) {
		/*
			var event_times = this.obstacles.map(function(obstacle) {
				var touch_time = obstacle.will_touch(moving_object);
				if(touch_time === false) { return false; }
				else { return {obstacle: obstacle, time: touch_time}; }
			}).filter(function(collision_time) {
				return collision_time !== false;
			});
			*/
			return false;
			/*


			var next_obstacle_collision = false;
			collision_times.forEach(function(collision) {
				if(next_obstacle_collision === false || collision.time < next_obstacle_collision.time) {
					next_obstacle_collision = collision;
				}
			});
			if(next_obstacle_collision === false) { return false; }
			else { return next_obstacle_collision.time; }
			*/
		};
		proto.restrict_path = function(moving_object, path) {
			return path;
		};
		proto.is_touching = function(moving_object) {
			return false;
		};
		proto.get_constraining_obstacles = function(moving_object, round) {
			var touching_obstacles = this.obstacles.map(function(obstacle) {
				return {obstacle: obstacle, signature: obstacle.touching(moving_object, round)};
			}).filter(function(touch_info) {
				return touch_info.signature !== 0;
			});;
			return touching_obstacles;
		};
	})(Map);

	return function(options) {
		return new Map(options);
	};
});
