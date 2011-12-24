(function(BrawlIO) {
var Actions = BrawlIO.game_constants.actions;
var _ = BrawlIO._;
var get_time = BrawlIO.get_time;

var Brawl = function(options) {
	var map = BrawlIO.create("map", options.map);
	var teams = _.map(options.teams, function(team_options, index) {
		return BrawlIO.create("team", _.extend({id: index}, team_options));
	});

	this.game = BrawlIO.create("game", {
		map: map
		, teams: teams
		, round_limit: options.round_limit
		, debug_mode: options.debug_mode
	});
	this.initialize();
	this.asked_to_run = false;
	this.workers_ready = false;
	this.game_callback = undefined;
	this.worker_sync_interval = undefined;
	this.logging = true;
};

(function(my) {
	var proto = my.prototype;
	proto.initialize = function() {
		this.create_player_workers();
	};
	//WORKERS=======
	proto.create_player_workers = function() {
		var self = this;
		var players = this.game.get_players();
		this._waiting_for_workers = players.length;
		this.player_workers = _.map(players, function(player) {
			var player_worker = new Worker("src/game/player_worker.js");
			player_worker.onmessage = function(event) {
				var data = event.data;
				self.on_player_message(player, player_worker, data, event);
			};
			return player_worker;
		});
		this.worker_sync_interval = window.setInterval(function() {
			_.forEach(self.player_workers, function(worker) {
				self.sync_worker(worker);
			});
		}, 5000);
	};
	proto.terminate_player_workers = function() {
		_.forEach(this.player_workers, function(player_worker) {
			player_worker.terminate();
		});
		window.clearInterval(this.worker_sync_interval);
	};
	proto.post = function(worker, message) {
		return worker.postMessage(message);
	};
	proto.on_player_message = function(player, worker, data) {
		if(data === "ready") {
			this._waiting_for_workers--;
			this.post(worker, {
				type: "initialize"
				, info: player.serialize()
			});
			if(this._waiting_for_workers === 0) {
				delete this._waiting_for_workers;
				this.workers_ready = true;
				this.run_if_ready();
			}
		} else {
			var type = data.type;
			if(type === "console.log") {
				if(this.logging) {
					console.log.apply(console, data.args);
				}
			} else if(type === "console.error") {
				if(this.logging) {
					console.error.apply(console, data.args);
				}
			} else if(type === "exception") {
				if(this.logging) {
					console.log(data.message);
				}
			} else if(type === "action") {
				var self = this;
				var request = data;
				var action = request.action;
				var action_type = BrawlIO.game_constants.actions.get_type(action);
				var options = request.options || {};
				var game = this.game;
				var delay, do_action;

				var callback = function() {};

				if(options.callback) {
					var callback_id = options.callback_id;
					callback = function(event) {
						self.post(worker, {
							type: "callback"
							, event_id: callback_id
							, event: event
						});
					};
				}

				if(action_type === BrawlIO.game_constants.actions.move_type) {
					delay = options.delay || 0;
					do_action = function(round) {
						var angle = 0;
						if(action === Actions.move.forward) { angle = 0; }
						else if(action === Actions.move.left) { angle = -1 * Math.PI/2.0; }
						else if(action === Actions.move.right) { angle = Math.PI/2.0; }
						else if(action === Actions.move.backward) { angle = Math.PI; }

						var speed = options.speed || player.get_max_movement_speed();
						if(action === Actions.move.stop) { speed = 0; }

						player.set_velocity(speed, angle, round);
						callback({
							type: "start"
							, action: action
						});

						if(options.duration!==undefined) {
							var stop_action = function(round) {
								player.set_velocity(0, 0, round);
								callback({
									type: "stop"
									, action: action
								});
							};
							game.on_round(stop_action, request.round+delay+options.duration, "Stop moving");
						}
					};
					game.on_round(do_action, request.round+delay, "Move");
				} else if(action_type === Actions.rotate_type) {
					delay = options.delay || 0;
					do_action = function(round) {
						var speed = options.speed || player.get_max_rotation_speed();
						if(action === Actions.rotate.stop) { speed = 0; }
						else if(action === Actions.rotate.counter_clockwise) { speed *= -1; }

						player.set_rotation_speed(speed, round);
						callback({
							type: "start"
							, action: action
						});

						if(options.duration !== undefined) {
							var stop_action = function(round) {
								player.set_rotation_speed(0, round);
								callback({
									type: "stop"
									, action: action
								});
							};
							game.on_round(stop_action, request.round+delay+options.duration, "Stop rotating");
						}
					};
					game.on_round(do_action, request.round+delay, "Rotate");
				} else if(action_type === Actions.instantaneous_type) {
					if(action === Actions.fire) {
						var do_fire = function() {
							player.set_auto_fire(options.automatic);
							player.fire();
						};
						game.on_round(do_fire, request.round, "Fire");
					} else if(action === Actions.stop_firing) {
						var do_stop_firing = function() {
							player.set_auto_fire(false);
						};
						game.on_round(do_stop_firing, request.round, "Stop firing");
					} else if(action === Actions.sense) {
						var snapshot_data = game.get_snapshot();
						snapshot_data.players.forEach(function(player) {
							delete player.player;
						});
						callback({
							type: "sense"
							, data: snapshot_data
						});
					}
				}
			}
		}
	};
	proto.run = function(callback) {
		this.game_callback = callback || undefined;
		this.asked_to_run = true;
		this.run_if_ready();
	};
	proto.ready_to_run = function() {
		return this.workers_ready;
	};
	proto.run_if_ready = function() {
		if(this.ready_to_run() && this.asked_to_run) {
			this.do_run();
		}
	};
	proto.do_run = function() {
		var self = this;
		this.game.on("start", function() {
			var start_time = get_time();
			_.forEach(self.player_workers, function(worker) {
				self.post(worker, {type: "game_start", start_time: start_time});
			});
		});
		this.game.on("end", function(event) {
			var winner = event.winner;
			if(_.isFunction(self.game_callback)) {
				self.game_callback(winner);
			}
		});

		this.game.start();
	};
	proto.terminate = function() {
		this.terminate_player_workers();
		this.game.stop();
	};
	proto.get_replay = function() {
		return this.game.get_replay();
	};
	proto.sync_worker = function(player_worker) {
		var game_round = this.game.get_round();
		var time = get_time();
		this.post(player_worker, {type: "sync_time", time: time, round: game_round});
	};
}(Brawl));

BrawlIO.define_factory("brawl", function(options) {
	return new Brawl(options);
});

}(BrawlIO));
