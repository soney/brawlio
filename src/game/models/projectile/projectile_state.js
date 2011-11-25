(function(BrawlIO) {
	var MovingObjectState = BrawlIO.get_type("MovingObjectState");

	var ProjectileState = function(options) {
		this.super_constructor.call(this, options);
		this.path = this.specified_path;
	};
	BrawlIO.oo_extend(ProjectileState, MovingObjectState);

	(function(my) {
	}(ProjectileState));

	BrawlIO.define_factory("projectile_state", function(options) {
		return new ProjectileState(options);
	});
}(BrawlIO));
