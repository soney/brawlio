(function(BrawlIO) {
	var Shape = BrawlIO.get_type("Shape");

	var CircleShape;
	CircleShape = function(options) {
		CircleShape.superclass.call(this, options);
		this.radius = options.radius;
		this.cx = options.x;
		this.cy = options.y;
		this.name = "circle";
	};
	BrawlIO.oo_extend(CircleShape, Shape);

	(function(my) {
		var proto = my.prototype;
		proto.get_radius = function() {
			return this.radius;
		};
	}(CircleShape));

	BrawlIO.define_type("CircleShape", CircleShape);
	BrawlIO.define_factory("circle_shape", function(options) {
		return new CircleShape(options);
	});
}(BrawlIO));
