importScripts("../vendor/require.js");
var is_node = typeof importScripts === "undefined";

var post = function() {
	if(is_node) {
		return postMessage.apply(self, arguments);
	} else {
		return self.postMessage.apply(self, arguments);
	}
};

var console = { 
	log: function() {
		var args = [];
		for(var i = 0, len = arguments.length; i<len; i++) {
			args.push(arguments[i]);
		}
		post({type: "console.log"
				, args: args});
	}
};
var controller = {}
	, game = {}
	, GameConstants
	, Actions;

require(["constants"], function(constants) {
	GameConstants = constants.game_constants;
	Actions = constants.actions;
});

var is_node = typeof importScripts === "undefined";

var post = function() {
	if(is_node) {
		return postMessage.apply(self, arguments);
	} else {
		return self.postMessage.apply(self, arguments);
	}
};


var get_time = function() {
	return new Date().getTime();
};

(function(controller) {
	controller.move = function(direction, user_options) {
		var action = undefined;
		if(direction.match(/back(ward(s)?)?/i)) {
			action = Actions.move.backward;
		} else if(direction.match(/left/i)) {
			action = Actions.move.left;
		} else if(direction.match(/right/i)) {
			action = Actions.move.right;
		} else if(direction.match(/stop/i)) {
			action = Actions.move.stop;
		} else {
			action = Actions.move.forward;
		}
		user_options = user_options || {};

		var options = {
			delay: user_options.delay
			, duration: user_options.duration
			, speed: user_options.speed
			, callback: user_options != null && (user_options.onStart != null || user_options.onStop != null)
			, callback_id:  game.addCallback({
				type: "action_callback"
				, options: options
			}, function(event) {
				var type = event.type;
				if(type === "start" && user_options.onStart != null) {
					user_options.onStart(event);
				}
				if(type === "stop" && user_options.onStop != null) {
					user_options.onStop(event);
				}
			})
		};

		return post({
			type: "action"
			, action: action
			, options: options
			, round: game.get_round()
		});
	};
	controller.turn = function(direction, user_options) {
		var action = undefined;
		if(direction.match(/(right)|(clockwise)/i)) {
			action = Actions.rotate.clockwise;
		} else if(direction.match(/stop/i)) {
			action = Actions.rotate.stop;
		} else {
			action = Actions.rotate.counter_clockwise;
		}

		user_options = user_options || {};

		var options = {
			delay: user_options.delay
			, duration: user_options.duration
			, speed: user_options.speed
			, callback: user_options != null && (user_options.onStart != null || user_options.onStop != null)
			, callback_id: game.addCallback({
					type: "action_callback"
					, options: options
				}, function(event) {
					var type = event.type;
					if(type === "start" && user_options.onStart != null) {
						user_options.onStart(event);
					}
					if(type === "stop" && user_options.onStop != null) {
						user_options.onStop(event);
					}
				})
		};

		return post({
			type: "action"
			, action: action
			, options: options
			, round: game.get_round()
		});
	};
	controller.fire = function(param, user_options) {
		var action = undefined;
		var automatic = false;

		if(param === "stop") {
			action = Actions.stop_firing;
		}
		else if(param === "automatic") {
			action = Actions.fire;
			automatic = true;
		} else {
			action = Actions.fire;
		}

		user_options = user_options || {};

		var options = {
			automatic: automatic
			, callback: user_options != null && (user_options.onFire != null || user_options.onReady != null)
			, callback_id: game.addCallback({
					type: "action_callback"
					, options: options
				}, function(event) {
					var type = event.type;
					if(type === "fire" && user_options.onFire != null) {
						user_options.onFire(event);
					}
					if(type === "weapon_ready" && user_options.onReady != null) {
						user_options.onReady(event);
					}
				})
		};

		return post({
			type: "action"
			, action: action
			, options: options
			, round: game.get_round()
		});
	};
	controller.sense = function(callback) {
		var action = Actions.sense;
		var options = {
			callback: true
			, callback_id: game.addCallback({
				type: "action_callback"
				, options: options
				}, function(event) {
					var data = event.data;
					data.players = data.players.map(function(pi) {
						return new Player(pi.number, pi.team_id, {x: pi.x, y: pi.y, theta: pi.theta});
					});
					data.projectiles = data.projectiles.map(function(pi) {
						return new Projectile();
					});
					data.map = new Map({width: data.map.width, height: data.map.height});

					callback(data);
				})
		};

		return post({
			type: "action"
			, action: action
			, options: options
			, round: game.get_round()
		});
	};

	var Map = function(dimensions) {
		this.dimensions = dimensions;
	}; (function(my) {
		var proto = my.prototype;
		proto.getWidth = function() { return this.dimensions.width; };
		proto.getHeight = function() { return this.dimensions.height; };
		proto.getDimensions = function() { return {width: this.getWidth(), height: this.getHeight()}; };
	})(Map);

	var Projectile = function() {
	}; (function(my) {
		var proto = my.prototype;
	})(Projectile);

	var Player = function(number, team_id, position) {
		this.number = number;
		this.team_id = team_id;
		this.position = position;
	}; (function(my) {
		var proto = my.prototype;
		proto.isAlly = function() { return this.team_id === controller.team_id; };
		proto.isOpponent = function() { return !this.isAlly(); };

		proto.isMe = function() { return this.number === controller.number; };
		proto.isNotMe = function() { return !this.isMe(); };

		proto.getLocation = function() { return this.position; };
	})(Player);
})(controller);


(function(game) {
	var get_id = (function() {
		var current_id = 0;
		return function() {
			return current_id++;
		};
	})();

	var event_listeners = [];

	var addCallback = function(options, listener) {
		var id = get_id();
		event_listeners[id] = listener;
		return id;
	};

	game.addCallback = function(options, listener) {
		return addCallback.apply(this, arguments);
	};

	game.onRound = function(listener, round) {
		var run_time = game.start_time + round*GameConstants.SIM_MS_PER_ROUND;
		var time_diff = run_time - get_time();
		if(time_diff <= 0) {
			listener();
		} else {
			setTimeout(listener, time_diff);
		}
	};

	game.setInterval = function(callback, rounds) {
		return setInterval(callback, rounds * GameConstants.SIM_MS_PER_ROUND);
	};
	game.clearInterval = function(id) {
		return clearInterval(id);
	};

	game.setTimeout = function(callback, rounds) {
		return setTimeout(callback, rounds * GameConstants.SIM_MS_PER_ROUND);
	};
	game.clearTimeout = function(id) {
		return clearTimeout(id);
	};

	game.on_event = function(data) {
		var event_listener = event_listeners[data.event_id];
		event_listener(data.event);
	};
	game.get_round = function(time) {
		time = time || get_time();
		return (time - this.start_time) * GameConstants.SIM_MS_PER_ROUND;
	};
})(game);

var code;

self.onmessage = function(event) {
	var data = event.data;
	var type = data.type;

	if(type === "initialize") {
		code = data.info.code;
		controller.number = data.info.number;
		controller.team_id = data.info.team_id;
	} else if(type === "game_start") {
		game.start_time = get_time();
		run();
	} else if(type === "callback") {
		game.on_event(data);
	}
};

var run = function() {
	(function() {
		var self = undefined; //Prevent code from evaling self
		var post = undefined; //...and from changing post
		var onRound = game.onRound
			, setTimeout = game.setTimeout
			, clearTimeout = game.clearTimeout
			, setInterval = game.setInterval
			, clearInterval = game.clearInterval
			, move = controller.move
			, turn = controller.turn
			, fire = controller.fire
			, sense = controller.sense
			;
		eval(code);
	}).call();
};
post("ready");
