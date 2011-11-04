define(function(require) {
require("vendor/underscore");
var constants = require("game/constants")
	, create_game = require("game/models/game")
	, create_map = require("game/models/map")
	, create_team = require("game/models/team")
	, Actions = constants.actions
	, GameConstants = constants.game_constants;

var Brawl = function(options) {
	var map = create_map(options.map);
	var teams = _.map(options.teams, function(team_options, index) {
		return create_team(_.extend({id: index}, team_options));
	});

	this.game = create_game({
		map: map
		, teams: teams
		, round_limit: options.round_limit
	});
	this.initialize();
	this.asked_to_run = false;
	this.workers_ready = false;
	this.game_callback = undefined;
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
			var player_worker = new Worker("game/player_worker.js");
			player_worker.onmessage = function(event) {
				var data = event.data;
				self.on_player_message(player, player_worker, data, event);
			};
			return player_worker;
		});
	};
	proto.terminate_player_workers = function() {
		_.forEach(this.player_workers, function(player_worker) {
			player_worker.terminate();
		});
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
				console.log.apply(console, data.args);
			} else if(type === "action") {
				var self = this;
				var request = data;
				var action = request.action;
				var action_type = Actions.get_type(action);
				var options = request.options || {};
				var game = this.game;

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
							game.round_timeout(stop_action, request.round+delay+options.duration);
						}
					};
					game.round_timeout(do_action, request.round+delay);
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
							game.round_timeout(stop_action, request.round+delay+options.duration);
						}
					};
					game.round_timeout(do_action, request.round+delay);
				} else if(action_type === Actions.instantaneous_type) {
					if(action === Actions.fire) {
						var do_fire = function() {
							player.set_auto_fire(options.automatic);
							player.fire();
						};
						game.round_timeout(do_fire, request.round);
					} else if(action === Actions.stop_firing) {
						var do_stop_firing = function() {
							player.set_auto_fire(false);
						};
						game.round_timeout(do_stop_firing, request.round);
					} else if(action === Actions.sense) {
						var snapshot_data = game.get_snapshot();
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
			_.forEach(self.player_workers, function(worker) {
				self.post(worker, {type: "game_start"});
			});
		});
		this.game.on("end", function(winner) {
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
})(Brawl);

return function(options) {
	return new Brawl(options);
};
});
