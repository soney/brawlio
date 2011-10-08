define(['game/models/paths/path'], function(Path) {
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
	})(Line);

	return Line;
});
