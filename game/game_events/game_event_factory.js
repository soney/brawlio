define(function(require) {
	require("vendor/underscore");
	var oo_utils = require("game/util/object_oriented");

	var GameEvent = function(options) {
		this.options = options;
		this.round = this.options.round;
	};
	(function(my) {
		var proto = my.prototype;
		proto.get_round = function() { return this.round; };
	})(GameEvent);
	//========================================
	var PlayerFired = function(options) {
		PlayerFired.superclass.call(this, options);
		this.player = options.player;
	};
	oo_utils.extend(PlayerFired, GameEvent);
	(function(my) {
		var proto = my.prototype;
		proto.get_player = function() {
			return this.player;
		};
	})(PlayerFired);
	//========================================
	var PlayerHit = function(options) {
		PlayerHit.superclass.call(this, options);
		this.projectile = options.projectile;
		this.hit_player = options.hit_player;
	};
	oo_utils.extend(PlayerHit, GameEvent);
	(function(my) {
		var proto = my.prototype;
		proto.get_hit_player = function() {
			return this.hit_player;
		};
		proto.get_projectile = function() {
			return this.projectile;
		};
	})(PlayerHit);
	//========================================

	return function(type, options) {
		if(type === "player_fired") {
			return new PlayerFired(options);
		} else if(type === "player_hit") {
			return new PlayerHit(options);
		}
	};
});
