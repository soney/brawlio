(function(BrawlIO) {
	var _ = BrawlIO._;
	var StaticObstacle = BrawlIO.get_type("StaticObstacle");

	var error_tolerance = 0.00001;

	var PolygonObstacle = function(options) {
		var shape = BrawlIO.create("polygon", {points: options.points, inverted: options.inverted});
		this.super_constructor.call(this, {shape: shape});
	};
	BrawlIO.oo_extend(PolygonObstacle, StaticObstacle);

	(function(my) {
		var proto = my.prototype;
		proto.get_line_segments = function() {
			return this.shape.get_line_segments();
		};

		proto.next_touch_event = function(moving_object, moving_object_state) {
			var shape = moving_object.get_shape();

			//if(!shape.is("circle")) {
				//console.error("Only circles are supported!");
			//}

			var line_segments = this.get_line_segments();
			var path = moving_object_state.get_path();
			var my_polygon = this.get_shape();
			var touch_events = _.map(line_segments,
										function(line_segment) {
											var normal = my_polygon.get_normal(line_segment);
											var event_info = BrawlIO.next_segment_path_event(line_segment, normal, path, shape.get_radius());

											if(event_info === false) {
												return false;
											} else if(event_info === true) {
												return _.extend(event_info, {
													line_segment: line_segment
												});
											} else {
												return _.extend(event_info, {
													line_segment: line_segment
												});
											}
										})
									.filter(function(intersection) {
										return intersection !== false;
									});

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
			var shape = moving_object.get_shape();
			//if(!shape.is("circle")) {
				//console.error("Only circles are supported!");
			//}

			var restricted_path = path;
			var line_segments = this.get_line_segments();
			var my_polygon = this.get_shape();
			_.forEach(line_segments, function(line_segment) {
				var normal = my_polygon.get_normal(line_segment);
				restricted_path = BrawlIO.restrict_path(line_segment, normal, restricted_path, shape.get_radius());
			});
			return restricted_path;
		};

		proto.is_touching = function(moving_object, position) {
			var line_segments = this.get_line_segments();
			var i, len = line_segments.length;
			var shape = moving_object.get_shape();
			//if(!shape.is("circle")) {
				//console.error("Only circles are supported!");
			//}

			var radius = shape.get_radius();
			for(i = 0; i<len; i++) {
				var line_segment = line_segments[i];
				if(line_segment.distance_to(position) <= radius + error_tolerance) { 
					return true;
				}
			}
			return false;
		};
	}(PolygonObstacle));

	BrawlIO.define_type("PolygonObstacle", PolygonObstacle);
}(BrawlIO));
