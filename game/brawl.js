define(["game/models/game", "game/replay/replay"], function(Game, Replay) {
var Actions = {
	move_type: 0
	, move: {
		stop: 00
		, forward: 01
		, backward: 02
		, left: 03
		, right: 04
	}

	, rotate_type: 1
	, rotate: {
		stop: 10
		, clockwise: 11
		, counter_clockwise: 12
	}

	, instantaneous_type: 2
	, fire: 20
	, stop_firing: 21
	, sense: 22

	, get_type: function(action) {
		if(action >= 00 && action <= 09) {
			return Actions.move_type;
		} else if(action >= 10 && action <= 19) {
			return Actions.rotate_type;
		} else if(action >= 20 && action <= 29) {
			return Actions.instantaneous_type;
		}
	}
};

var PLAYER_WORKER_PATH = "game/workers/player_worker.js";

var Brawl = function(options) {
	this.updates_per_round = 5.0;
	this.ms_per_round = 1000.0;
	this.game = new Game($.extend({
		ms_per_round: this.ms_per_round
	}, options));
	this.replay = new Replay({ 
		map: this.game.get_map()
	});
	this.initialize_player_workers();
};

(function(my) {
	var proto = my.prototype;
	var get_time = function() {
		return (new Date()).getTime();
	};

	proto.initialize_player_workers = function() {
		var self = this;

		this.player_workers = this.game.get_players().map(function(player) {
			var player_worker = new Worker(PLAYER_WORKER_PATH);
			player.worker = player_worker;

			player_worker.onmessage = function(event) {
				self.on_player_message(player, event);
			};

			player_worker.postMessage({
				type: "initialize"
				, info: player.serialize()
			});

			return player_worker;
		});
	};
	proto.terminate_player_workers = function() {
		this.player_workers.forEach(function(player_worker) {
			player_worker.terminate();
		});
	};

	proto.run = function(callback) {
		this.callback = callback;
		var self = this;
		this.game.on("update", function() {
			var snapshot = self.game.get_snapshot();
			self.replay.concat_snapshot(snapshot);
		});
		this.game.start();
		var start_time = this.game.get_start_time();
		this.player_workers.forEach(function(player_worker) {
			player_worker.postMessage({
				type: "game_start"
				, start_time: start_time
			});
		});
		window.setInterval(function() {
			self.game.update();
		}, this.ms_per_round / this.updates_per_round);
	};
	proto.terminate = function() {
		this.terminate_player_workers();
	};
	proto.get_replay = function() {
		return this.replay;
	};

	proto.compute_request_timing = function(request) {
		var request_time = request.time;
		var options = request.options;

		var delay_rounds = 0;
		if(options.delay != null) {
			delay_rounds = options.delay;
		}

		if(isNaN(delay_rounds)) {
			delay_rounds = 0;
		} else {
			delay_rounds = Math.max(0, delay_rounds);
		}
		var delay_ms = delay_rounds * this.ms_per_round;

		var desired_start_time_ms = request_time + delay_ms;

		var rv = {
			start_time_ms: desired_start_time_ms
			, stop_time_ms: undefined
		};

		if(options.duration) {
			var duration = options.duration;
			if(!isNaN(duration)) {
				duration = Math.max(0, duration);
				var duration_ms = duration * this.ms_per_round;
				var desired_stop_time_ms = desired_start_time_ms + duration_ms;

				rv.stop_time_ms = desired_stop_time_ms;
			}
		}
		return rv;
	};
	var at_time = function(callback, time) {
		var curr_time = get_time();
		var time_diff = time - curr_time;
		if(time_diff > 0) {
			setTimeout(callback, time_diff);
		} else {
			callback();
		}
	};

	proto.do_at_time = function(callback, time) {
		var at_round = this.game.get_round(time);
		at_time(function() {
			callback(at_round);
		}, time);
	};
	proto.on_player_message = function(player, event) {
		var data = event.data;
		var type = data.type;
		if(type === "console.log") {
			console.log.apply(console, data.args);
		}
		else if(type === "action") {
			var self = this;
			var request = data;
			var action = request.action;
			var action_type = Actions.get_type(action);
			var options = request.options;

			var request_timing = this.compute_request_timing(request);

			var callback = function() {};

			if(options.callback) {
				var callback_id = options.callback_id;
				callback = function(event) {
					self.broadcast_event({
						event_id: callback_id
						, player_id: player_id
						, event: event
					});
				};
			}

			if(action_type === Actions.move_type) {
				var do_action = function() {
					var angle = 0;
					if(action === Actions.move.forward) angle = 0;
					else if(action === Actions.move.left) angle = Math.PI/2.0;
					else if(action === Actions.move.right) angle = -1 * Math.PI/2.0;
					else if(action === Actions.move.backward) angle = Math.PI;

					var speed = options.speed || player.get_max_movement_speed();
					if(action === Actions.move.stop) speed = 0;

					self.game.update();
					player.set_velocity(speed, angle);

					if(request_timing.stop_time_ms) {
						var stop_action = function(round) {
							self.game.update();
							player.set_velocity(0, 0);
						};
						self.do_at_time(stop_action, request_timing.stop_time_ms);
					}
				};
				this.do_at_time(do_action, request_timing.start_time_ms);
			} else if(action_type === Actions.rotate_type) {
				var do_action = function() {
					var speed = options.speed || player.get_max_rotation_speed();
					if(action === Actions.rotate.stop) speed = 0;
					else if(action === Actions.rotate.counter_clockwise) speed *= -1;

					self.game.update();
					player.set_rotation_speed(speed);

					if(request_timing.stop_time_ms) {
						var stop_action = function(round) {
							self.game.update();
							player.set_rotation_speed(0);
						};
						self.do_at_time(stop_action, request_timing.stop_time_ms);
					}
				};
				this.do_at_time(do_action, request_timing.start_time_ms);
			}
		}
	};
})(Brawl);
return Brawl;
});
