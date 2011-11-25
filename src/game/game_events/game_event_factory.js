(function(BrawlIO) {
	var GameEvent = function(options) {
		this.options = options;
		this.round = this.options.round;
	};
	(function(my) {
		var proto = my.prototype;
		proto.get_round = function() { return this.round; };
	}(GameEvent));
	//========================================
	var PlayerFired = function(options) {
		this.super_constructor.call(this, options);
		this.player = options.player;
		this.projectile = options.projectile;
	};
	BrawlIO.oo_extend(PlayerFired, GameEvent);
	(function(my) {
		var proto = my.prototype;
		proto.get_player = function() {
			return this.player;
		};
		proto.get_projectile = function() {
			return this.projectile;
		};
	}(PlayerFired));
	//========================================
	var PlayerHit = function(options) {
		this.super_constructor.call(this, options);
		this.projectile = options.projectile;
		this.hit_player = options.hit_player;
	};
	BrawlIO.oo_extend(PlayerHit, GameEvent);
	(function(my) {
		var proto = my.prototype;
		proto.get_hit_player = function() {
			return this.hit_player;
		};
		proto.get_projectile = function() {
			return this.projectile;
		};
	}(PlayerHit));
	//========================================

	BrawlIO.define_factory("player_fired_event", function(options) {
		return new PlayerFired(options);
	});
	BrawlIO.define_factory("player_hit_event", function(options) {
		return new PlayerHit(options);
	});
}(BrawlIO));
