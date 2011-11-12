define(function(require) {
	var Circle = require("game/geometry/shapes/circle");
	var MovingObject = require("game/models/moving_object/moving_object");
	var oo_utils = require("game/util/object_oriented");

	var Projectile = function(options) {
		var radius = options.radius; //Radius in tiles
		Projectile.superclass.call(this, _.extend({
			shape: new Circle({radius: radius})
			, translational_velocity: {speed: 0}
			, type: "projectile"
		}, options));
		this.fired_by = options.fired_by;
		this.initialized = false;
	};
	oo_utils.extend(Projectile, MovingObject);

	(function(my) {
		var proto = my.prototype;
		proto.get_radius = function() { return this.shape.get_radius(); };
		proto.can_collide_with = function(moving_object) {
			if(moving_object.is("player")) {
				return moving_object.can_collide_with(this);
			}
			return true;
		};
		proto.get_fired_by = function() {
			return this.fired_by;
		};
	})(Projectile);

	return function(options) { return new Projectile(options); };
});