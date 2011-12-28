(function(BrawlIO) {
	var GameEvent = function(options) {
		this.options = options;
		this.round = this.options.round;
		this.type = options.type;
	};
	(function(my) {
		var proto = my.prototype;
		proto.get_round = function() { return this.round; };
		proto.get_type = function() { return this.type; };
		proto.serialize = function() {
			return {
				round: this.get_round()
				, type: this.get_type()
			};
		};
		proto.is = function(type) { return this.get_type() === type; };
	}(GameEvent));
	//========================================
	var PlayerFired;
	PlayerFired = function(options) {
		options.type = "player_fired";
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
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.player = this.get_player().get_id();
			rv.projectile = this.get_projectile().get_id();
			return rv;
		};
	}(PlayerFired));
	//========================================
	var PlayerHit;
	PlayerHit = function(options) {
		options.type = "player_hit";
		PlayerHit.superclass.call(this, options);
		this.projectile = options.projectile;
		this.player = options.player;
	};
	BrawlIO.oo_extend(PlayerHit, GameEvent);
	(function(my) {
		var proto = my.prototype;
		proto.get_player = function() {
			return this.player;
		};
		proto.get_projectile = function() {
			return this.projectile;
		};
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.player = this.get_player().get_id();
			rv.projectile = this.get_projectile().get_id();
			return rv;
		};
	}(PlayerHit));
	//========================================
	var Console;
	Console = function(options) {
		options.type = "console";
		Console.superclass.call(this, options);
		this.log_type = options.log_type;
		this.args = options.args;
		this.player = options.player;
	};
	BrawlIO.oo_extend(Console, GameEvent);
	(function(my) {
		var proto = my.prototype;
		proto.get_log_type = function() { return this.log_type; };
		proto.get_args = function() { return this.args; };
		proto.get_player = function() { return this.player; };
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.log_type = this.get_log_type();
			rv.args = this.get_args();
			return rv;
		};
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

	BrawlIO.define_factory("deserialized_game_event", function(obj, moving_object_map) {
		var type = obj.type;
		var player, projectile;
		if(type === "player_fired") {
			player = moving_object_map[obj.player];
			projectile = moving_object_map[obj.projectile];
			return BrawlIO.create("player_fired_event", {
				player: player
				, projectile: projectile
				, round: obj.round
			});
		} else if(type === "player_hit") {
			player = moving_object_map[obj.player];
			projectile = moving_object_map[obj.projectile];
			return BrawlIO.create("player_hit_event", {
				player: player
				, projectile: projectile
				, round: obj.round
			});
		} else if(type === "console") {
			player = moving_object_map[obj.player];
			return BrawlIO.create("console_event", {
				player: player
				, log_type: obj.log_type
				, args: obj.args
			});
		}
	});
}(BrawlIO));
