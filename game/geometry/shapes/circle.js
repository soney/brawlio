define(function(require) {
	var Shape = require("game/geometry/shapes/shape");
	var oo_utils = require("game/util/object_oriented");

	var CircleShape = function(options) {
		CircleShape.superclass.call(this, options);
		this.radius = options.radius;
		this.cx = options.x;
		this.cy = options.y;
		this.name="circle";
	};
	oo_utils.extend(CircleShape, Shape);

	(function(my) {
		var proto = my.prototype;
		proto.get_radius = function() {
			return this.radius;
		};
	}(CircleShape));

	return function(options) {
		return new CircleShape(options);
	};
});
