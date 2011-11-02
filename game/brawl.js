define(function(require) {
require("vendor/underscore");
var constants = require("game/constants")
	, create_game = require("game/models/game")
	, create_map = require("game/models/map")
	, create_team = require("game/models/team")
	, Replay = require("game/replay/replay")
	, Actions = constants.Actions
	, GameConstants = constants.GameConstants
	, PLAYER_WORKER_PATH = "game/player_worker.js";

var Brawl = function(options) {
	var map = create_map(options.map);
	var teams = _.map(options.teams, function(team_options) {
		return create_team(team_options);
	});

	this.game = create_game({
		map: map
		, teams: teams
		, round_limit: options.round_limit
	});
};

/*

var Brawl = function(options) {
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
		var self = this;
		this.game.on("update", function() {
			var snapshot = self.game.get_snapshot();
			self.replay.concat_snapshot(snapshot);
		});
		this.game.on("end", function(event) {
			var winner = event.winner;
			self.terminate();
			if(callback) {
				callback(winner.get_id());
			}
		});
		this.game.start();
		this.game.players.forEach(function(player) {
			self.replay.add_player(player);
			player.on("fire", function(event) {
				self.on_player_fire(player, event);
			});
		});
		this.player_workers.forEach(function(player_worker) {
			player_worker.postMessage({
				type: "game_start"
			});
		});
	};
	proto.terminate = function() {
		window.clearInterval(this.game_update_interval);
		this.terminate_player_workers();
	};
	proto.get_replay = function() {
		return this.replay;
	};

	proto.on_player_fire = function(player, event) {
		var callback = this._fire_callback;
		if(callback) {
			if(event.type === "fire") {
				callback({
					type: "fire"
					, fired: event.fired
				});
			}
			this.game.on_round(function() {
				callback({
					type: "weapon_ready"
				});
			}, player.get_next_fireable_round());
		}
	};
	proto.on_player_message = function(player, event) {
		var data = event.data;
		var type = data.type;
		var game = this.game;
		if(type === "console.log") {
			console.log.apply(console, data.args);
		}
		else if(type === "action") {
			var self = this;
			var request = data;
			var action = request.action;
			var action_type = Actions.get_type(action);
			var options = request.options || {};

			var callback = function() {};

			if(options.callback) {
				var callback_id = options.callback_id;
				var worker = player.worker;
				callback = function(event) {
					worker.postMessage({
						type: "callback"
						, event_id: callback_id
						, event: event
					});
				};
			}

			if(action_type === Actions.move_type) {
				var delay = options.delay || 0;
				var do_action = function(round) {
					var angle = 0;
					if(action === Actions.move.forward) angle = 0;
					else if(action === Actions.move.left) angle = -1 * Math.PI/2.0;
					else if(action === Actions.move.right) angle = Math.PI/2.0;
					else if(action === Actions.move.backward) angle = Math.PI;

					var speed = options.speed || player.get_max_movement_speed();
					if(action === Actions.move.stop) speed = 0;

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
						game.on_round(stop_action, request.round+delay+options.duration);
					}
				};
				game.on_round(do_action, request.round+delay);
			} else if(action_type === Actions.rotate_type) {
				var delay = options.delay || 0;
				var do_action = function(round) {
					var speed = options.speed || player.get_max_rotation_speed();
					if(action === Actions.rotate.stop) speed = 0;
					else if(action === Actions.rotate.counter_clockwise) speed *= -1;

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
						game.on_round(stop_action, request.round+delay+options.duration);
					}
				};
				game.on_round(do_action, request.round+delay);
			} /*else if(action_type === Actions.instantaneous_type) {
				if(action === Actions.fire) {
					var do_fire = function() {
						player.set_auto_fire(options.automatic);
						player.fire();
					};

					this._fire_callback = callback;
					this.do_at_time(do_fire, request_timing.start_time_ms);
				} else if(action === Actions.stop_firing) {
					var do_stop_firing = function() {
						player.set_auto_fire(false);
					};
					this.do_at_time(do_stop_firing, request_timing.start_time_ms);
				} else if(action === Actions.sense) {
					var snapshot_data = this.game.get_snapshot();
					snapshot_data.projectiles.forEach(function(projectile) {
						delete projectile.projectile;
					});
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
	};
})(Brawl);
			/**/
return function(options) {
	return new Brawl(options);
};
});
