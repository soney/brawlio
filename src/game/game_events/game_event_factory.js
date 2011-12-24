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
	var PlayerFired;
	PlayerFired = function(options) {
		PlayerFired.superclass.call(this, options);
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
	var PlayerHit;
	PlayerHit = function(options) {
		PlayerHit.superclass.call(this, options);
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
	var Console;
	Console = function(options) {
		Console.superclass.call(this, options);
		this.type = options.type;
		this.args = options.args;
	};
	BrawlIO.oo_extend(Console, GameEvent);
	(function(my) {
		var proto = my.prototype;
		proto.get_type = function() { return this.type; };
		proto.get_args = function() { return this.args; };
	}(Console));
	//========================================

	BrawlIO.define_factory("player_fired_event", function(options) {
		return new PlayerFired(options);
	});
	BrawlIO.define_factory("player_hit_event", function(options) {
		return new PlayerHit(options);
	});
	BrawlIO.define_factory("console_event", function(options) {
		return new Console(options);
	});
}(BrawlIO));
