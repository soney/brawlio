define(function(require) {
	require("vendor/underscore");
	var path_factory = require("game/geometry/paths/path_factory");
	var root_finder = require("game/math/root_finder");

	var error_tolerance = 0.000001;
	var close_to = function(a,b) {
		return Math.abs(a-b) < error_tolerance;
	};

	var root_finder_error_tolerance = 0.001;

	var get_next_event = function(state1, state2) {
		var path1 = state1.get_path();
		var path2 = state2.get_path();

		var path1_is_stationary = path1.is("stationary") || path1.is("rotating_stationary");
		var path2_is_stationary = path2.is("stationary") || path2.is("rotating_stationary");
		if(path1_is_stationary && path2_is_stationary) {
			return false;
		}
		var path1_is_linear = path1.is("constant_velocity_line") || path1.is("sinusoidal_velocity_line");
		var path2_is_linear = path2.is("constant_velocity_line") || path2.is("sinusoidal_velocity_line");

		if(path1_is_linear && path2_is_stationary) {
			return get_next_line_stationary_event(state1, state2);
		} else if(path1_is_stationary && path2_is_linear) {
			return get_next_line_stationary_event(state2, state1);
		} else if(path1_is_linear && path2_is_linear) {
			return get_next_line_line_event(state1, state2);
		}

		var path1_is_circular = path1.is("constant_velocity_circle");
		var path2_is_circular = path2.is("constant_velocity_circle");
		if(path1_is_circular && path2_is_stationary) {
			return get_next_circle_stationary_event(state1, state2);
		} else if(path1_is_stationary && path2_is_circular) {
			return get_next_circle_stationary_event(state2, state1);
		} else if(path1_is_circular && path2_is_linear) {
			return get_next_circle_line_event(state1, state2);
		} else if(path1_is_linear && path2_is_circular) {
			return get_next_circle_line_event(state2, state1);
		} else if(path1_is_circular && path2_is_curcular) {
			return get_next_circle_circle_event(state1, state2);
		}

		return false;
	};

	var get_distance_fn = function(path1, path2, under_distance) {
		return function(time) {
			var pos_1 = path1.get_position(time);
			var pos_2 = path2.get_position(time);

			var x1 = pos_1.x;
			var y1 = pos_1.y;
			var x2 = pos_2.x;
			var y2 = pos_2.y;

			return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2)) - under_distance;
		};
	};

	var get_next_line_stationary_event = function(line_state, stationary_state) {
		var line_path = line_state.get_path();
		var stationary_path = stationary_state.get_path();

		var line_object = line_state.get_moving_object();
		var stationary_object = stationary_state.get_moving_object();

		var line_object_radius = line_object.get_radius();
		var stationary_object_radius = stationary_object.get_radius();
		var r = line_object_radius + stationary_object_radius;

		if(line_path.is("constant_velocity_line")) {
			var stationary_position = stationary_path.get_position(0);
			var line = line_path.get_line();

			var point_line_distance = line.distance_to(stationary_position);

			if(point_line_distance > r + error_tolerance) {
				return false;
			}

			var line_normals = line.get_normals();
			var line_normal = _.min(line_normals, function(line_normal) {
				var p = {
					x: stationary_position.x + line_normal.x
					, y: stationary_position.y + line_normal.y
				};
				return line.distance_to(p);
			});
			var scaled_line_normal = line_normal.normalize(point_line_distance);
			var point_along_line = {x: stationary_position.x + scaled_line_normal.x, y: stationary_position.y + scaled_line_normal.y};

			var delta_diff_squared = Math.pow(r, 2) - Math.pow(point_line_distance, 2);
			if(delta_diff_squared < 0) {
				return false;
			}
			var distance_along_line = Math.sqrt(delta_diff_squared);

			var line_theta = line.get_theta();
			var dx = distance_along_line*Math.cos(line_theta);
			var dy = distance_along_line*Math.sin(line_theta);

			var p1 = {
				x: point_along_line.x + dx
				, y: point_along_line.y + dy
			};
			var p2 = {
				x: point_along_line.x - dx
				, y: point_along_line.y - dy
			};
			var t1 = line_path.delta_t_until_at(p1.x, p1.y);
			var t2 = line_path.delta_t_until_at(p2.x, p2.y);


			var shorter_time;

			if(t1 === false && t2 === false) { return false; }
			else if(t1 === false && t2 !== false) { shorter_time = t2; }
			else if(t1 !== false && t2 === false) { shorter_time = t1; }
			else { shorter_time = Math.min(t1, t2); }

			return {
				time: shorter_time
				, event_type: "Moving Object Hit A"
			};
		} else {
			var distance_fn = get_distance_fn(line_path, stationary_path, r - root_finder_error_tolerance);
			var t = root_finder(distance_fn, 0, 1);
			if(t === false) { return false };
			return {
				time: t
				, event_type: "Moving Object Hit A (root finder)"
			};
		}
	};
	var get_next_line_line_event = function(line_state1, line_state2) {
		var line_path1 = line_state1.get_path();
		var line_path2 = line_state2.get_path();
		var line_object1 = line_state1.get_moving_object();
		var line_object2 = line_state2.get_moving_object();
		var line1_radius = line_object1.get_radius();
		var line2_radius = line_object2.get_radius();
		var r = line1_radius + line2_radius;
		if(line_path1.is("constant_velocity_line") && line_path2.is("constant_velocity_line")) {
			/*
			d = sqrt( (x2' - x1')^2 + (y2' - y1') )
			d = sqrt( (x2 + vx2*t - x1 - vx1*t)^2 + (y2 + vy2*t - y1 - vy1*t)^2 )
			d = sqrt( (t*(vx2-vx1) + (x2-x1))^2 + (t*(vy2-vy1) + (y2-y1))^2 )
			...let A = vx2-vx1, B = x2-x1, C = vy2-vy1, D = y2-y1
			placing into Wolfram Alpha... http://goo.gl/bqmWp
			*/
			var x1 = line_state1.x0
				, y1 = line_state1.y0
				, angle1 = line_state1.translational_velocity.angle + line_state1.theta0
				, vx1 = line_state1.translational_velocity.speed * Math.cos(angle1)
				, vy1 = line_state1.translational_velocity.speed * Math.sin(angle1)
				, x2 = line_state2.x0
				, y2 = line_state2.y0
				, angle2 = line_state2.translational_velocity.angle + line_state2.theta0
				, vx2 = line_state2.translational_velocity.speed * Math.cos(angle2)
				, vy2 = line_state2.translational_velocity.speed * Math.sin(angle2);


			var A = vx2 - vx1
				, B = x2 - x1
				, C = vy2 - vy1
				, D = y2 - y1;

			var discriminant = Math.pow(2*A*B + 2*C*D, 2) - 4 * (A*A + C*C) * (B*B + D*D - r*r);
			if(discriminant < 0) {
				return false;
			}
			var t1 = (Math.sqrt(discriminant) - 2*A*B - 2*C*D)/(2*(A*A + C*C));
			var t2 = (-1*Math.sqrt(discriminant) - 2*A*B - 2*C*D)/(2*(A*A + C*C));
			var t= Math.min(t1,t2);
			return {
				time: t
				, event_type: "Moving Object Hit B"
			};
		} else {
			var distance_fn = get_distance_fn(line_path1, line_path2, r - root_finder_error_tolerance);
			var t = root_finder(distance_fn, 0, 1);
			if(t === false) { return false };
			return {
				time: t
				, event_type: "Moving Object Hit B (root finder)"
			};
		}
	};
	var get_next_circle_stationary_event = function(circle_state, stationary_state) {
		var circle_path = circle_state.get_path();
		var stationary_path = stationary_state.get_path();

		var rad1 = circle_state.get_moving_object().get_radius();
		var rad2 = stationary_state.get_moving_object().get_radius();
		var r = rad1 + rad2;

		var distance_fn = get_distance_fn(circle_path, stationary_path, r - root_finder_error_tolerance);
		var t = root_finder(distance_fn, 0, 1);
		if(t === false) { return false };
		return {
			time: t
			, event_type: "Moving Object Hit C (root finder)"
		};
	};
	var get_next_circle_line_event = function(circle_state, line_state) {
		var circle_path = circle_state.get_path();
		var line_path = line_state.get_path();

		var rad1 = circle_state.get_moving_object().get_radius();
		var rad2 = line_state.get_moving_object().get_radius();
		var r = rad1 + rad2;

		var distance_fn = get_distance_fn(circle_path, line_path, r - root_finder_error_tolerance);
		var t = root_finder(distance_fn, 0, 1);
		if(t === false) { return false };
		return {
			time: t
			, event_type: "Moving Object Hit D (root finder)"
		};
	};
	var get_next_circle_circle_event = function(circle_state1, circle_state2) {
		var circle_path1 = circle_state1.get_path();
		var circle_path2 = circle_state2.get_path();

		var rad1 = circle_state1.get_moving_object().get_radius();
		var rad2 = circle_state2.get_moving_object().get_radius();
		var r = rad1 + rad2;

		var distance_fn = get_distance_fn(circle_path1, circle_path2, r - root_finder_error_tolerance);
		var t = root_finder(distance_fn, 0, 1);
		if(t === false) { return false };
		return {
			time: t
			, event_type: "Moving Object Hit E (root finder)"
		};
	};

	window.root_finder = root_finder;

	return {
		get_next_event: get_next_event
	};
});
