importScripts("constants.js");
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
	, game = {};
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
			action = game_constants.actions.move.backward;
		} else if(direction.match(/left/i)) {
			action = game_constants.actions.move.left;
		} else if(direction.match(/right/i)) {
			action = game_constants.actions.move.right;
		} else if(direction.match(/stop/i)) {
			action = game_constants.actions.move.stop;
		} else {
			action = game_constants.actions.move.forward;
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
			action = game_constants.actions.rotate.clockwise;
		} else if(direction.match(/stop/i)) {
			action = game_constants.actions.rotate.stop;
		} else {
			action = game_constants.actions.rotate.counter_clockwise;
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
			action = game_constants.actions.stop_firing;
		}
		else if(param === "automatic") {
			action = game_constants.actions.fire;
			automatic = true;
		} else {
			action = game_constants.actions.fire;
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
		var action = game_constants.actions.sense;
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
		var round_diff = (round - game.sync_round);
		var run_time = game.sync_time + round_diff*game_constants.SIM_MS_PER_ROUND;
		var time_diff = run_time - get_time();
		if(time_diff <= 0) {
			listener();
		} else {
			setTimeout(listener, time_diff);
		}
	};

	game.setInterval = function(callback, rounds) {
		return setInterval(callback, rounds * game_constants.SIM_MS_PER_ROUND);
	};
	game.clearInterval = function(id) {
		return clearInterval(id);
	};

	game.setTimeout = function(callback, rounds) {
		return setTimeout(callback, rounds * game_constants.SIM_MS_PER_ROUND);
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
		var sync_round = this.sync_round;
		var sync_time = this.sync_time;
		return sync_round + (time - sync_time) / game_constants.SIM_MS_PER_ROUND;
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
		game.sync_time = data.start_time;
		game.sync_round = 0;
		run();
	} else if(type === "callback") {
		game.on_event(data);
	} else if(type === "sync_time") {
		game.sync_time = data.time;
		game.sync_round = data.round;
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
