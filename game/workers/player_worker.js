var controller = {}
	, game = {};

var is_node = typeof importScripts === "undefined";
if(is_node) {
	var actions = require(__dirname+'/actions');
	var Actions = actions.Actions;

	var utils = require(__dirname+'/util/worker_utils');
	var Hash = utils.Hash;
	var CONST = utils.CONST;
}
else {
	importScripts('game/workers/actions.js');
	importScripts('game/workers/util/worker_utils.js');
}

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
	controller.move = function(direction, options) {
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

		options = options || {};
		var user_callback = options.callback;
		options.callback = true;
		options.callback_id = game.addEventListener({
				type: "action_callback"
				, options: options
			}, function(event) {
				var type = event.type;
				if(type === "start" && options.onStart != null) {
					options.onStart(event);
				}
				if(type === "stop" && options.onStop != null) {
					options.onStop(event);
				}
			});

		return post({
			type: "action"
			, action: action
			, options: options
			, time: get_time()
		});
	};
	controller.turn = function(direction, options) {
		var action = undefined;
		if(direction.match(/(right)|(clockwise)/i)) {
			action = Actions.rotate.clockwise;
		} else if(direction.match(/stop/i)) {
			action = Actions.rotate.stop;
		} else {
			action = Actions.rotate.counter_clockwise;
		}

		options = options || {};
		options.callback = true;
		options.callback_id = game.addEventListener({
				type: "action_callback"
				, options: options
			}, function(event) {
				var type = event.type;
				if(type === "start" && options.onStart != null) {
					options.onStart(event);
				}
				if(type === "stop" && options.onStop != null) {
					options.onStop(event);
				}
			});

		return post({
			type: "action"
			, action: action
			, options: options
			, time: get_time()
		});
	};
	controller.fire = function(param, options) {
		var action = undefined;
		var options = undefined;
		options = options || {};
		if(param === "stop") {
			action = Actions.stop_firing;
		}
		else if(param === "automatic") {
			action = Actions.fire;
			options.automatic = true;
		} else {
			action = Actions.fire;
		}
		options.callback = true;
		options.callback_id = game.addEventListener({
				type: "action_callback"
				, options: options
			}, function(event) {
				var type = event.type;
				if(type === "fire" && options.onStart != null) {
					options.onFire(event);
				}
				if(type === "weapon_ready" && options.onStop != null) {
					options.onReady(event);
				}
			});

		return post({
			type: "action"
			, action: action
			, options: options
			, time: get_time()
		});
	};
	controller.sense = function(callback) {
		var action = Actions.sense;
		var options = {};

		options.callback = true;
		options.callback_id = game.addEventListener({
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
			});

		return post({
			type: "action"
			, action: action
			, options: options
			, time: get_time()
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

	var event_listeners = new Hash();

	var addEventListener = function(options, listener) {
		var type;
		if(typeof options === "string") {
			type = options;
		}
		else {
			try {
				type = options.type
			} catch(e) {
				console.error(e);
				return;
			}
		}
		var repeats = options.repeats || false;
		var id = get_id();
		event_listeners.set(id, listener);
		post({
			type: "event_listener"
			, event_type: type
			, repeats: repeats
			, id: id 
			, options: options
			, time: get_time()
		});
		return id;
	};
	var removeEventListener = function(id) {
		event_listeners.unset(id);
	};

	game.on = game.addEventListener = function(options, listener) { return addEventListener.apply(this, arguments); };
	game.removeEventListener = function(options, listener) { return removeEventListener.apply(this, arguments); };

	game.onRound = function(listener, round) {
		var run_time = game.start_time + round/CONST.ROUNDS_PER_MS;
		var time_diff = run_time - get_time();
		if(time_diff <= 0) {
			listener();
		} else {
			setTimeout(listener, time_diff);
		}
	};

	game.setInterval = function(callback, rounds) {
		return setInterval(callback, rounds / CONST.ROUNDS_PER_MS);
	};
	game.clearInterval = function(id) {
		return clearInterval(id);
	};

	game.setTimeout = function(callback, rounds) {
		return setTimeout(callback, rounds / CONST.ROUNDS_PER_MS);
	};
	game.clearTimeout = function(id) {
		return clearTimeout(id);
	};

	game.on_event = function(data) {
		var event_listener = event_listeners.get(data.event_id);
		event_listener(data.event);
	};
})(game);

var code;

self.onmessage = function(event) {
	var data = event.data;
	var type = data.type;

	if(type === "initialize") {
		code = data.code;
		controller.number = data.number;
		controller.team_id = data.team_id;
	} else if(type === "message") {
		var message = data.message;
		if(message.type === "game_start") {
			game.start_time = message.start_time;
			run();
		}
	} else if(type === "event") {
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
