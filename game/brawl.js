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
};

(function() {
	this.run = function(callback) {
		var player_id = 0;
		var player_workers = new Array(Constants.TEAM_SIZE*2);
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
				});
				player_worker.onmessage = function(event) {
					var data = event.data;
					brawl_worker.postMessage({
						type: "player_request"
						, player_id: player_model.id //don't just use player_id here...
						, request: data
					});
				};

				players[player_id] = player_model;
				player_workers[player_id] = player_worker;
				player_id++;
			});
		}

		var self = this;
		var brawl_worker = new Worker(BRAWL_WORKER_PATH);
		brawl_worker.onmessage = function(event) {
			var data = event.data;
			var type = data.type
				, message = data.message;
			if(type === "broadcast") {
				player_workers.forEach(function(player_worker) {
					player_worker.postMessage({
						type: "message"
						, message: message
					});
				});
			}
			else if(type === "replay_chunk") {
				var replay_chunk = data.replay_chunk;
				self.on_replay_update(replay_chunk);
			}
			else if(type === "event") {
				var audience = data.audience
					, event_id = data.event_id;

				for(var i = 0, len = audience.length; i<len; i++) {
					var player_id = audience[i];
					var player_worker = player_workers[player_id];
					player_worker.postMessage({
						type: "event"
						, event_id: event_id
					});
				}
			}
			else if(type === "game_over") {
				var winning_id = data.winner;
				if(winning_id !== null) {
					self.winner = self.teams[winning_id];
				}
				var old_on_replay_update = self.on_replay_update;
				self.on_replay_update = function() {
					old_on_replay_update.apply(self, arguments);
					self.terminate(callback);
					self.on_replay_update = function(){};
				};
				self.request_replay_update();
			}
		};

		brawl_worker.postMessage({
			type: "initialize"
			, teams: this.teams
			, map: this.map
			, round_limit: this.round_limit
		});

		brawl_worker.postMessage({
			type: "run"
		});

		this.player_workers = player_workers;
		this.brawl_worker = brawl_worker;
		this.request_replay_update();
	};

	this.get_replay = function() {
		return this.replay;
	};
	this.request_replay_update = function() {
		this.brawl_worker.postMessage({
			type: "get_replay_chunk"
			, from_snapshot: this.replay.get_last_snapshot_index() + 1
		});
	};
	this.on_replay_update = function(replay_chunk) {
		this.replay.concat_chunk(replay_chunk);
	};

	this.stop = function() {
		this.brawl_worker.postMessage({
			type: "stop"
		});
	};

	this.terminate = function(callback) {
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
}).call(Brawl.prototype);

return Brawl;
});

