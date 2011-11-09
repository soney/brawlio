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
				[{x: 48, y: 20, theta: 0}]
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
		proto.get_next_event = function(moving_object, moving_object_state) {
			var touch_events = _(this.obstacles).chain()
												.map(function(obstacle) {
													var touch_info = obstacle.next_touch_event(moving_object, moving_object_state);
													if(touch_info === false) { return false; }
													else { return _.extend({obstacle: obstacle}, touch_info); }
												})
												.filter(function(touch_info) {
													return touch_info !== false;
												})
												.value();

			var next_touch_event = false;
			touch_events.forEach(function(touch_event) {
				if(next_touch_event === false || touch_event.time < next_touch_event.time) {
					next_touch_event = touch_event;
				}
			});
			if(next_touch_event === false) { return false; }
			else { return next_touch_event; }
		};
		proto.restrict_path = function(moving_object, path) {
			var restricted_path = path;
			var touching_obstacles = _(this.obstacles)	.forEach(function(obstacle) {
															restricted_path = obstacle.restrict_path(moving_object, restricted_path);
														});
			return restricted_path;
		};
		proto.is_touching = function(moving_object, path) {
			return false;
		};
		proto.get_constraining_obstacles = function(moving_object, round) {
			var touching_obstacles = _(this.obstacles)	.chain()
														.map(function(obstacle) {
															return {obstacle: obstacle, signature: obstacle.touching(moving_object, round)};
														})
														.filter(function(touch_info) {
															return touch_info.signature !== 0;
														})
														.value();
			return touching_obstacles;
		};
	})(Map);

	return function(options) {
		return new Map(options);
	};
});
