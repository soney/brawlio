define(['game/geometry/paths/path'], function(Path) {
	var Line = function(options) {
		this.a = options.a;
		this.b = options.b;
		this.c = options.c;
	};

	(function(my) {
		my.fromPointAndAngle = function(x0, y0, theta) {
			return new Line({
				a: Math.sin(theta)
				, b: Math.cos(theta)
				, c: -y0*Math.cos(theta) - x0*Math.sin(theta)
			});
		};
		my.fromPoints = function(p0, p1) {
			return new Line({
				a: p0.y - p1.y
				, b: p1.x - p0.x
				, c: p0.x*p1.y - p1.x*p0.y
			});
		};
	})(Line);

	return Line;
});
