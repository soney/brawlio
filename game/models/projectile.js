define(function(require) {
	var Circle = require("game/geometry/shapes/circle");
	var MovingObject = require("game/models/moving_object");
	var oo_utils = require("game/util/object_oriented");

	var Projectile = function(options) {
		var radius = options.radius; //Radius in tiles
		Projectile.superclass.call(this, {
			shape: new Circle({radius: radius})
		});
	};
	oo_utils.extend(Projectile, MovingObject);

	(function(my) {
	})(Projectile);

	return function(options) { return new Projectile(options); };
});
