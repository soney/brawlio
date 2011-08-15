var player = {}
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

(function(player) {
	var assoc_ask = function(fn_name, action, arg_names, option_defaults, callback_aliases) {
		player [fn_name] = function() {
			var args = Array.prototype.slice.call(arguments);
			var options = {};
			for(var option_name in option_defaults) {
				options[option_name] = option_defaults[option_name]
			}

			if(args.length === 1 && typeof args[0] === "object") {
				for(var option_name in args[0]) {
					options[option_name] = args[0][option_name];
				}
			}
			else {
				for(var i = 0, len = args.length; i<len; i++) {
					var arg_name = arg_names[i];
					if(arg_name != null) {
						options[arg_name] = args[i];
					}
				}
			}

			var has_callback = options.callback != null;
			if(!has_callback) {
				if(callback_aliases) {
					for(var callback_type in callback_aliases) {
						var callback_alias = callback_aliases[callback_type];
						if(options[callback_alias] != null) {
							has_callback = true;
							break;
						}
					}
				}
			}

			if(has_callback) {
				var callback = options.callback;
				//Don't try to send the callback over to the game...
				//just set the callback as an event listener
				//addEventListener(); TODO
				options.callback_id = game.addEventListener({
					type: "action_callback"
					, action: action
					, options: options
				}, function(event) {
					if(callback != null) {
						callback(event);
					}
					if(callback_aliases) {
						var type = event.type;
						for(var callback_type in callback_aliases) {
							if(type === callback_type) {
								var callback_alias = callback_aliases[callback_type];
								if(options[callback_alias] != null) {
									options[callback_alias](event);
								}
							}
						}
					}
				});
			}
			options.callback = has_callback;

			return post({
				type: "action"
				, action: action
				, options: options
				, time: get_time()
			});
		};
	};

	assoc_ask('stopMoving', Actions.move.stop, ["delay"], {
		delay: 0
		, callback: undefined
	});
	assoc_ask('moveForward', Actions.move.forward, ["duration"], {
		duration: null
		, delay: 0
		, callback: undefined
		, speed: undefined
		, on_start: undefined
		, on_stop: undefined
	}, {
		start: "on_start"
		, stop: "on_stop"
	});
	assoc_ask('moveBackward', Actions.move.backward, ["duration"], {
		duration: null
		, delay: 0
		, callback: undefined
		, speed: undefined
		, on_start: undefined
		, on_stop: undefined
	}, {
		start: "on_start"
		, stop: "on_stop"
	});
	assoc_ask('moveLeft', Actions.move.left, ["duration"], {
		duration: null
		, delay: 0
		, callback: undefined
		, speed: undefined
		, on_start: undefined
		, on_stop: undefined
	}, {
		start: "on_start"
		, stop: "on_stop"
	});
	assoc_ask('moveRight', Actions.move.right, ["duration"], {
		duration: null
		, delay: 0
		, callback: undefined
		, speed: undefined
		, on_start: undefined
		, on_stop: undefined
	}, {
		start: "on_start"
		, stop: "on_stop"
	});

	assoc_ask('stopRotating', Actions.rotate.stop, ["delay"], {
		delay: 0
		, callback: undefined
	});
	assoc_ask('rotateClockwise', Actions.rotate.clockwise, ["duration"], {
		duration: null
		, delay: 0
		, callback: undefined
		, speed: undefined
		, on_start: undefined
		, on_stop: undefined
	}, {
		start: "on_start"
		, stop: "on_stop"
	});
	assoc_ask('rotateCounterClockwise', Actions.rotate.counter_clockwise, ["duration"], {
		duration: null
		, delay: 0
		, callback: undefined
		, speed: undefined
		, on_start: undefined
		, on_stop: undefined
	}, {
		start: "on_start"
		, stop: "on_stop"
	});

	assoc_ask('fire', Actions.fire, ["angle_offset", "automatic"], {
		angle_offset: 0
		, delay: 0
		, duration: null
		, automatic: false
		, callback: undefined
		, on_fire: undefined
		, on_ready: undefined
	}, {
		start: "on_start"
		, stop: "on_stop"
	});
	assoc_ask('stopFiring', Actions.stop_firing, ["delay"], {
		delay: 0
		, callback: undefined
	});
	assoc_ask('sense', Actions.sense, ["callback"], {
		callback: undefined
	});

	player.stopTurning = player.stopRotating;
	player.turnRight = player.rotateClockwise;
	player.turnLeft = player.rotateCounterClockwise;

	player.isAlly = function(other_player) {
		return other_player.team_id === this.team_id;
	};
	player.isOpponent = function(other_player) {
		return !player.isAlly(other_player);
	};
	player.isMe = function(other_player) {
		return other_player.number === this.number;
	};
	player.isNotMe = function(other_player) {
		return !this.isMe(other_player);
	};
})(player);

(function(game) {
	var get_id = (function() {
		var current_id = 0;
		return function() {
			return current_id++;
		//return (Math.random()+"").slice(2);
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
			}
			catch(e) {
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
		game.addEventListener({
			type: "round"
			, round: round
		}, listener);
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

	if(data.type === "initialize") {
		code = data.code;
		player.number = data.number;
		player.team_id = data.team_id;
	}
	else if(data.type === "message") {
		var message = data.message;
		if(message.type === "game_start") {
			run();
		}
	}
	else if(data.type === "event") {
		game.on_event(data);
	}
};

var run = function() {
	(function() {
		var self = undefined; //Prevent code from evaling self
		var post = undefined; //...and from changing post
		eval(code);
	}).call();
};
