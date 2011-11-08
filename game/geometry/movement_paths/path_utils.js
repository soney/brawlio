define(function(require) {
	require("vendor/underscore");

	var line_segment_hits_moving_circle = function(line_segment, circle_path, circle_radius) {
		if(circle_path.is("stationary")) {
			return false;
		} else if(circle_path.is("constant_velocity_line")) {
			var moving_object_ray = circle_path.get_ray();
			var intersection_points = moving_object_ray.intersects_with(line_segment, circle_radius);

			if(intersection_points === true) { //It's already intersecting
				return 0;
			} else if(intersection_points === false) { //It will never intersect
				return false;
			} else { //It will intersect at some time..
				var intersection_times = intersection_points.map(function(intersection_point) {
					var delta_t = circle_path.delta_t_until_at(intersection_point.x, intersection_point.y);
					return delta_t;
				}).filter(function(delta_t) {
					return delta_t !== false && delta_t >= 0;
				});

				if(intersection_times.length === 0) {return false;}
				return Math.min.apply(Math, intersection_times);
			}
		}
		return false;
	};

	var restrict_path = function() {
	};

	return {
		line_segment_hits_moving_circle: line_segment_hits_moving_circle
	};
});
