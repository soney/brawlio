define(['game/geometry/shapes/shape', 'game/util/object_oriented'], function(Shape, oo_utils) {
	var CircleShape = function(options) {
		CircleShape.superclass.call(this, options);
		this.radius = options.radius;
		this.name="circle";
	};
	oo_utils.extend(CircleShape, Shape);

	(function(my) {
		var proto = my.prototype;
		proto.get_radius = function() {
			return this.radius;
		};
	})(CircleShape);

	return CircleShape;
});
