importScripts('game/actions.js');

var player = {};

(function(player) {
	var assoc_ask = function(fn_name, action) {
		player [fn_name] = function() {
			return self.postMessage({
				type: "action"
				, action: action
			});
		};
	};

	assoc_ask('stop_moving', Actions.move.stop);
	assoc_ask('move_forward', Actions.move.forward);
	assoc_ask('move_backward', Actions.move.backward);
	assoc_ask('move_left', Actions.move.left);
	assoc_ask('move_right', Actions.move.right);

	assoc_ask('stop_rotating', Actions.rotate.stop);
	assoc_ask('rotate_clockwise', Actions.rotate.clockwise);
	assoc_ask('rotate_counter_clockwise', Actions.rotate.counterclockwise);
})(player);

self.onmessage = function(event) {
	var data = event.data;
	var type = data.type;

	if(data.type === "initialize") {
		self.code = data.code;
		player.number = data.number;
	}
	else if(data.type === "message") {
		var message = data.message;
		if(message.type === "game_start") {
			self.run();
		}
	}
};

self.run = function() {
	var code = self.code;
	(function() {
		var self = undefined; //Prevent code from evaling self
		eval(code);
	}).call();
};
