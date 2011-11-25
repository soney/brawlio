(function(BrawlIO) {
	var _ = BrawlIO._;

	var Map = function(options) {
		if(options === undefined) {
			options = {};
		}
		this.attributes = _.extend({
			width: 50 //Width in tiles
			, height: 50 //Height in tiles
			, start_positions: [
				[{x: 10, y: 10, theta: 0}]
				, [{x: 40, y: 40, theta: 0}]
			]
		}, options);
		this.obstacles = [
			BrawlIO.create("map_boundary_obstacle", {
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
			_(this.obstacles)	.forEach(function(obstacle) {
											restricted_path = obstacle.restrict_path(moving_object, restricted_path);
										});
			return restricted_path;
		};
		proto.is_touching = function(moving_object, position) {
			var i, len = this.obstacles.length;

			for(i = 0; i<len; i++) {
				var obstacle = this.obstacles[i];
				if(obstacle.is_touching(moving_object, position)) {
					return true;
				}
			}
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
	}(Map));

	BrawlIO.define_factory("map", function(options) {
		return new Map(options);
	});
}(BrawlIO));
