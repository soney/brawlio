(function(BrawlIO) {
	var _ = BrawlIO._;
	var MovingObject = BrawlIO.get_type("MovingObject");

	var Projectile = function(options) {
		var radius = options.radius; //Radius in tiles
		this.super_constructor.call(this, _.extend({
			shape: BrawlIO.create("circle_shape", {radius: radius})
			, translational_velocity: {speed: 0}
			, type: "projectile"
		}, options));
		this.fired_by = options.fired_by;
		this.initialized = false;
	};
	BrawlIO.oo_extend(Projectile, MovingObject);

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
	}(Projectile));

	BrawlIO.define_factory("projectile", function(options) {
		return new Projectile(options);
	});
}(BrawlIO));
