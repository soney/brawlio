(function(BrawlIO) {
	var MovingObjectState = BrawlIO.get_type("MovingObjectState");

	var ProjectileState;
	ProjectileState = function(options) {
		ProjectileState.superclass.call(this, options);
		this.path = this.specified_path;
	};
	BrawlIO.oo_extend(ProjectileState, MovingObjectState);

	(function(my) {
		var proto = my.prototype;
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.type = "projectile_state";
			return rv;
		};
		my.deserialize = function(obj, moving_object_map) {
			var rv = BrawlIO.create("player_state", {
				moving_object: moving_object_map[obj.moving_object]
				, x0: obj.x0
				, y0: obj.y0
				, theta0: obj.theta0
				, rotational_velocity: obj.rotational_velocity
				, translational_velocity: obj.translational_velocity
				, path: BrawlIO.create("deserialized_movement_path", obj.path)
			});
			return rv;
		};
	}(ProjectileState));

	BrawlIO.define_factory("projectile_state", function(options) {
		return new ProjectileState(options);
	});
	BrawlIO.define_factory("deserialized_projectile_state", function(obj, moving_object_map) {
		return ProjectileState.deserialize(obj, moving_object_map);
	});
}(BrawlIO));
