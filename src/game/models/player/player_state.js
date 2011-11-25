(function(BrawlIO) {
	var MovingObjectState = BrawlIO.get_type("MovingObjectState");

	var PlayerState = function(options) {
		this.super_constructor.call(this, options);
		this.health = options.health;
		this.path = this.game.restrict_path(this.moving_object, this.specified_path);
	};
	BrawlIO.oo_extend(PlayerState, MovingObjectState);

	(function(my) {
		var proto = my.prototype;
		proto.get_health = function() {
			return this.health;
		};
	}(PlayerState));

	BrawlIO.define_factory("player_state", function(options) {
		return new PlayerState(options);
	});
}(BrawlIO));
