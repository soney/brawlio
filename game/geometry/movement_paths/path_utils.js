define(function(require) {
	require("vendor/underscore");

	var line_segment_hits_moving_circle = function(line_segment, circle_path, circle_radius) {
		if(circle_path.is("stationary")) {
			return false;
		} else if(circle_path.is("constant_velocity_line")) {
			console.log("CVL");
		}
		return false;
	};

	return {
		line_segment_hits_moving_circle: line_segment_hits_moving_circle
	};
});
