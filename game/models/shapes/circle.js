define(['game/models/paths/path'], function(Path) {
	var CircleShape = function(options) {
		this.radius = options.radius;
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_radius = function() {
			return this.radius;
		};
	})(CircleShape);

	return CircleShape;
});
