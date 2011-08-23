define(function(require, exports, module) {
var AlternativeWorker = require("webworker").Worker;

var is_node = typeof process !== "undefined";

var PLAYER_WORKER_PATH, BRAWL_WORKER_PATH;
if(is_node) { //We are on Node.js
	this.Worker = AlternativeWorker;
	PLAYER_WORKER_PATH = __dirname + "/workers/player_worker.js";
	BRAWL_WORKER_PATH = __dirname + "/workers/brawl_worker.js";
}
else {
	PLAYER_WORKER_PATH = "game/workers/player_worker.js";
	BRAWL_WORKER_PATH = "game/workers/brawl_worker.js";

	//*
	//console.log("I'm not on node");
	// https://raw.github.com/davidflanagan/WorkerConsole/master/WorkerConsole.js
	if (this.console && this.console.log) {
		 // If there is already a console.log() function defined, then wrap the
		 // Worker() constructor so that workers get console.log(), too.
		// Remember the original Worker() constructor
		this._Worker = Worker;

		// Make this.Worker writable, so we can replace it.
		Object.defineProperty(this, "Worker", {writable: true});

		// Replace the Worker() constructor with this augmented version
		this.Worker = function Worker(url) {
			// Create a real Worker object that first loads this file to define
			// console.log() and then loads the requested URL
			var w = new _Worker("WorkerConsole.js#" + url);

			// Create a side channel for the worker to send log messages on
			var channel = new MessageChannel();

			// Send one end of the channel to the worker
			w.postMessage("console", [channel.port2]);

			// And listen for log messages on the other end of the channel
			channel.port1.onmessage = function(e) {
				var args = e.data;                // Array of args to console.log()
				args.unshift(url + ": ");         // Add an arg to id the worker
				console.log.apply(console, args); // Pass the args to the real log
			}

			// Return the real Worker object from this fake constructor
			return w;
		}
	}
	else {
		 //If there wasn't a console.log() function defined, then we're in a
		 //Worker created with the wrapped Worker() constructor above, and
		 //we need to define the console.
		 //
		 //Wait until we get the event that delivers the MessagePort sent by the
		 //main thread. Once we get it, we define the console.log() function
		 //and load and run the original file that was passed to the constructor.
		self.onmessage = function(e) {
			if (e.data === "console") {
				// Define the console object
				self.console = { 
					_port: e.ports[0],           // Remember the port we log to
					log: function log() {        // Define console.log()
						// Copy the arguments into a real array
						var args = Array.prototype.slice.call(arguments);
						// Send the arguments as a message, over our side channel
						console._port.postMessage(args);
					}
				};

				// Get rid of this event handler
				onmessage = null;

				// Now run the script that was originally passed to Worker()
				var url = location.hash.substring(1); // Get the real URL to run
				importScripts(url);                   // Load and run it now
			}
		}
	}
	/**/
}

var Constants = require("./constants");
var Replay = require("./replay/replay");

var Brawl = function(options) {
	this.teams = options.teams;
	this.map = options.map;
	this.round_limit = options.round_limit;
	var self = this;
	this.replay = new Replay({
		map: {
			width: this.map.attributes.width
			, height: this.map.attributes.height
		}
		, update: function() {
			self.request_replay_update();
		}
	});
	this.initialize_workers();
};

(function(my) {
	var proto = my.prototype;

	proto.initialize_workers = function() {
		var self = this;
		var player_id = 0;
		this.player_workers = new Array(Constants.TEAM_SIZE*2);
		this.brawl_worker = new Worker(BRAWL_WORKER_PATH);
		var players = new Array(Constants.TEAM_SIZE*2);
		for(var i = 0, leni = this.teams.length; i<leni; i++) {
			var team = this.teams[i];
			team.id = i;
			team.player_models.forEach(function(player_model, number) {
				player_model.id = player_id;
				var player_worker = new Worker(PLAYER_WORKER_PATH);
				player_worker.postMessage({
					type: "initialize"
					, code: team.code
					, number: number
					, team_id: team.id
				});
				player_worker.onmessage = function(event) {
					var data = event.data;
					self.brawl_worker.postMessage({
						type: "player_request"
						, player_id: player_model.id //don't just use player_id here...
						, request: data
					});
				};

				players[player_id] = player_model;
				self.player_workers[player_id] = player_worker;
				player_id++;
			});
		}

		this.brawl_worker.onmessage = function(event) {
			var data = event.data; var type = data.type;

			if(type === "game_start") {
				self.on_game_start(data.start_time);
			} else if(type === "broadcast") {
				self.broadcast(data.message);
			} else if(type === "event") {
				self.on_game_event(data.audience, data.event_id, data.event);
			} else if(type === "replay_chunk") {
				self.on_replay_chunk(data.replay_chunk);
			} else if(type === "game_over") {
				self.on_game_over(data.winner);
			}
		};

		this.brawl_worker.postMessage({
			type: "initialize"
			, teams: this.teams
			, map: this.map
			, round_limit: this.round_limit
		});
	};

	proto.on_game_start = function(start_time) {
		this.player_workers.forEach(function(player_worker) {
			player_worker.postMessage({
				type: "game_start"
				, start_time: start_time
			});
		});
	};
	proto.broadcast = function(message) {
		this.player_workers.forEach(function(player_worker) {
			player_worker.postMessage({
				type: "message"
				, message: message
			});
		});
	};
	proto.on_game_event = function(audience, event_id, event) {
		for(var i = 0, len = audience.length; i<len; i++) {
			var player_id = audience[i];
			var player_worker = this.player_workers[player_id];
			player_worker.postMessage({
				type: "event"
				, event_id: event_id
				, event: event
			});
		}
	};
	proto.on_replay_chunk = function(replay_chunk) {
		this.replay.concat_chunk(replay_chunk);
	};
	proto.on_game_over = function(winning_id) {
		var self = this;
		if(winning_id !== null) {
			this.winner = this.teams[winning_id];
		}
		var old_on_replay_chunk = this.on_replay_chunk;
		this.on_replay_chunk = function() {
			old_on_replay_chunk.apply(self, arguments);
			this.terminate(this.callback);
			this.on_replay_chunk = function(){};
		};
		this.request_replay_update();
	};

	proto.run = function(callback) {
		this.brawl_worker.postMessage({
			type: "run"
		});
		this.request_replay_update();
		this.callback = callback;
	};

	proto.get_replay = function() {
		return this.replay;
	};
	proto.request_replay_update = function() {
		this.brawl_worker.postMessage({
			type: "get_replay_chunk"
			, from_snapshot: this.replay.get_last_snapshot_index() + 1
		});
	};

	proto.stop = function() {
		this.brawl_worker.postMessage({
			type: "stop"
		});
	};

	proto.terminate = function(callback) {
		for(var i = 0, len = this.player_workers.length; i<len; i++) {
			var player_worker = this.player_workers[i];
			player_worker.terminate();
		}

		this.brawl_worker.terminate();
		this.replay.mark_complete();
		if(callback) {
			callback(this.winner === undefined ? undefined : this.winner.id);
		}
	};
})(Brawl);

return Brawl;
});

