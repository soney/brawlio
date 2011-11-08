define(function(require) {
	var Line = require("game/geometry/paths/line");
	var LineSegment = require("game/geometry/paths/line_segment");
	var Circle = require("game/geometry/paths/circle");
	var Ray = require("game/geometry/paths/ray");

	return function(type) {
		if(type === "line_from_points") {
			return Line.fromPoints.apply(Line, _.tail(arguments));
		} else if(type === "line_from_point_and_angle") {
			return Line.fromPointAndAngle.apply(Line, _.tail(arguments));
		} else if(type === "line_segment_from_points") {
			return LineSegment.fromPoints.apply(LineSegment, _.tail(arguments));
		} else if(type === "ray_from_point_and_angle") {
			return Ray.fromPointAndAngle.apply(Ray, _.tail(arguments));
		}
	};
});
