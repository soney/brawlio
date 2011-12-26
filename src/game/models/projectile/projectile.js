(function(BrawlIO) {
	var _ = BrawlIO._;
	var MovingObject = BrawlIO.get_type("MovingObject");

	var Projectile;
	Projectile = function(options) {
		var radius = options.radius; //Radius in tiles
		Projectile.superclass.call(this, _.extend({
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

		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.fired_by = this.get_fired_by().get_id();
			rv.radius = this.get_radius();
			return rv;
		};

		my.deserialize = function(obj, moving_object_map) {
			var fired_by = moving_object_map[obj.fired_by];
			return new my({
				radius: obj.radius
				, fired_by: fired_by
			});
		};
	}(Projectile));

	BrawlIO.define_factory("projectile", function(options) {
		return new Projectile(options);
	});
	BrawlIO.define_factory("deserialized_projectile", function(obj, moving_object_map) {
		return Projectile.deserialize(obj, moving_object_map);
	});
}(BrawlIO));
