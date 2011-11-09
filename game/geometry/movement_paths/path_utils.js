define(function(require) {
	require("vendor/underscore");
	var path_factory = require("game/geometry/paths/path_factory");
	var create_movement_path = require("game/geometry/movement_paths/movement_path");

	var close_to = function(a,b) {
		return Math.abs(a-b) < 0.00001;
	};

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
		} else if(circle_path.is("constant_velocity_circle")) {
			var circle = circle_path.get_circle();

			var larger_circle = circle.add_radius(circle_radius);
			var larger_circle_intersection_points = larger_circle.intersects_with_line_segment(line_segment);

			if(larger_circle_intersection_points === false) { return false; }
			var circle_cx = circle.get_cx();
			var circle_cy = circle.get_cy();
			var intersection_point_vectors = _.map(larger_circle_intersection_points, function(point) {
				var vector = path_factory("vector_from_points", circle_cx, circle_cy, point.x, point.y);
				return vector.normalize(circle.get_radius());
			});
			var intersection_points = _.map(intersection_point_vectors, function(ip_vector) {
				return {x: circle_cx + ip_vector.get_x(), y: circle_cy + ip_vector.get_y()};
			});
			console.log(intersection_points);
		}
		return false;
	};

	var line_is_touching = function(line, circle_position, circle_radius) {
		var distance = line.distance_to(circle_position);
		return distance <= circle_radius + 0.00001;
	};

	var restrict_path = function(line_segment, circle_path, circle_radius, line_segment_normal) {
		var circle_start = circle_path.get_position(0);
		if(line_is_touching(line_segment, circle_start, circle_radius)) {
			if(circle_path.is("stationary")) {
				return circle_path;
			} else if(circle_path.is("constant_velocity_line")) {
				var circle_path_vector = circle_path.get_vector();
				var normal_magnitude = Math.abs(circle_path_vector.dot(line_segment_normal));
				var proper_normal = line_segment_normal.normalize(normal_magnitude);
				var new_movement_vector = circle_path_vector.add(proper_normal);

				if(close_to(new_movement_vector.get_magnitude(), 0)) {
					return create_movement_path("stationary", {
						x0: circle_start.x
						, y0: circle_start.y
					});
				} else {
					return create_movement_path("constant_velocity_line", {
						x0: circle_start.x
						, y0: circle_start.y
						, angle: new_movement_vector.get_theta()
						, speed: new_movement_vector.get_magnitude()
					});
				}
			}
		}
		return circle_path;
	};

	return {
		line_segment_hits_moving_circle: line_segment_hits_moving_circle
		, restrict_path: restrict_path
	};
});
