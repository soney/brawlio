var is_node = typeof importScripts === "undefined";
if(is_node) {
	var actions = require(__dirname+'/actions');
	var Actions = actions.Actions;

	var utils = require(__dirname+'/util/worker_utils');
	var Hash = utils.Hash;
}
else {
	importScripts('game/workers/actions.js');
	importScripts('game/workers/util/worker_utils.js');
}

var get_time = function() {
	return new Date().getTime();
};

var post = function() {
	if(is_node) {
		return postMessage.apply(self, arguments);
	}
	else {
		return self.postMessage.apply(self, arguments);
	}
};

var event_listeners = new Hash();

var addEventListener = function(listener, type, options) {
	var id = get_random_id();
	event_listeners.set(id, listener);
	post({
		type: "event_listener"
		, event_type: type
		, id: id 
		, options: options
	});
	return id;
};
var removeEventListener = function(id) {
	event_listeners.unset(id);
};

var get_random_id = function() {
	return (Math.random()+"").slice(2);
};

var player = {};

(function(player) {
	var assoc_ask = function(fn_name, action) {
		player [fn_name] = function() {
			var options = Array.prototype.slice.call(arguments);
			return post({
				type: "action"
				, action: action
				, options: options
				, time: get_time()
			});
		};
	};

	assoc_ask('stopMoving', Actions.move.stop);
	assoc_ask('moveForward', Actions.move.forward);
	assoc_ask('moveBackward', Actions.move.backward);
	assoc_ask('moveLeft', Actions.move.left);
	assoc_ask('moveRight', Actions.move.right);

	assoc_ask('stopRotating', Actions.rotate.stop);
	assoc_ask('stopTurning', Actions.rotate.stop);
	assoc_ask('rotateClockwise', Actions.rotate.clockwise);
	assoc_ask('turnRight', Actions.rotate.clockwise);
	assoc_ask('rotateCounterClockwise', Actions.rotate.counter_clockwise);
	assoc_ask('turnLeft', Actions.rotate.counter_clockwise);

	assoc_ask('fire', Actions.fire);
})(player);

var game = {};

(function(game) {
	game.addEventListener = function(listener, type, options) { return addEventListener.apply(this, arguments); };
	game.onRound = function(listener, round) {
		game.addEventListener(listener, "round", {round: round});
	};

	game.setInterval = function(callback, rounds) {
	};

	game.setTimeout = function(callback, rounds) {
		console.log("in " + rounds + " rounds");
	};
})(game);

var code;

self.onmessage = function(event) {
	var data = event.data;
	var type = data.type;

	if(data.type === "initialize") {
		code = data.code;
		player.number = data.number;
	}
	else if(data.type === "message") {
		var message = data.message;
		if(message.type === "game_start") {
			run();
		}
	}
	else if(data.type === "event") {
		var event_id = data.event_id;
		var event_listener = event_listeners.get(event_id);
		event_listener();
	}
};

var run = function() {
	(function() {
		var self = undefined; //Prevent code from evaling self
		eval(code);
	}).call();
};
