define(function(require) {
	require("vendor/underscore");
	var path_factory = require("game/geometry/paths/path_factory");

	var error_tolerance = 0.000001;
	var close_to = function(a,b) {
		return Math.abs(a-b) < error_tolerance;
	};

	
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

	var get_next_line_stationary_event = function(line_state, stationary_state) {
		var line_path = line_state.get_path();
		var stationary_path = stationary_state.get_path();

		var line_object = line_state.get_moving_object();
		var stationary_object = stationary_state.get_moving_object();

		var line_object_radius = line_object.get_radius();
		var stationary_object_radius = stationary_object.get_radius();
		var r = line_object_radius + stationary_object_radius;

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
	};
	var get_next_line_line_event = function(line_state1, line_state2) {
		return false;
	};
	var get_next_circle_stationary_event = function(circle_state, stationary_state) {
		return false;
	};
	var get_next_circle_line_event = function(circle_state, line_state) {
		return false;
	};
	var get_next_circle_circle_event = function(circle_state1, circle_state2) {
		return false;
	};

	return {
		get_next_event: get_next_event
	};
});
