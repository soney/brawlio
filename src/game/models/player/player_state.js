(function(BrawlIO) {
	var MovingObjectState = BrawlIO.get_type("MovingObjectState");

	var PlayerState;
	PlayerState = function(options) {
		PlayerState.superclass.call(this, options);
		this.health = options.health;
	};
	BrawlIO.oo_extend(PlayerState, MovingObjectState);

	(function(my) {
		var proto = my.prototype;
		proto.get_health = function() {
			return this.health;
		};
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.health = this.get_health();
			rv.type = "player_state";
			return rv;
		};
		my.deserialize = function(obj, moving_object_map) {
			var rv = BrawlIO.create("player_state", {
				moving_object: moving_object_map[obj.moving_object]
				, x0: obj.x0
				, y0: obj.y0
				, theta0: obj.theta0
				, health: obj.health
				, rotational_velocity: obj.rotational_velocity
				, translational_velocity: obj.translational_velocity
				, path: BrawlIO.create("deserialized_movement_path", obj.path)
			});
			return rv;
		};
	}(PlayerState));

	BrawlIO.define_factory("player_state", function(options) {
		return new PlayerState(options);
	});
	BrawlIO.define_factory("deserialized_player_state", function(obj, moving_object_map) {
		return PlayerState.deserialize(obj, moving_object_map);
	});
}(BrawlIO));
