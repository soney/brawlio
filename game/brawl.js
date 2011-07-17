if (this.console && this.console.log) {
    /* 
     * If there is already a console.log() function defined, then wrap the
     * Worker() constructor so that workers get console.log(), too.
     */
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
    /*
     * If there wasn't a console.log() function defined, then we're in a
     * Worker created with the wrapped Worker() constructor above, and
     * we need to define the console.
     * 
     * Wait until we get the event that delivers the MessagePort sent by the
     * main thread. Once we get it, we define the console.log() function
     * and load and run the original file that was passed to the constructor.
     */
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

define(["game/constants", "game/replay/replay", "vendor/underscore"], function(Constants, Replay) {
	function get_time() {
		return (new Date()).getTime();
	}

	var Brawl = function(options) {
		this.teams = options.teams;
		for(var i = 0, len = this.teams.length; i<len; i++) {
			this.teams[i].index = i+1;
		}
		this.map = options.map;
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
		this.run = function() {
			var player_id = 0;
			var team_id = 0;
			var player_workers = new Array(Constants.TEAM_SIZE*2);
			var players = new Array(Constants.TEAM_SIZE*2);
			for(var i = 0, leni = this.teams.length; i<leni; i++) {
				var team = this.teams[i];
				team.id = team_id;
				team_id++;
				_.forEach(team.player_models, function(player_model, number) {
					player_model.id = player_id;

					var player_worker = new Worker('game/player_worker.js');
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
			var brawl_worker = new Worker('game/brawl_worker.js');
			brawl_worker.onmessage = function(event) {
				var data = event.data;
				var type = data.type
					, message = data.message;
				if(type === "broadcast") {
					_.forEach(player_workers, function(player_worker) {
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
			};
			brawl_worker.postMessage({
				type: "initialize"
				, teams: this.teams
				, map: this.map
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

		this.terminate = function(replay_callback) {
			for(var i = 0, len = this.player_workers.length; i<len; i++) {
				var player_worker = this.player_workers[i];
				player_worker.terminate();
			}
			this.brawl_worker.terminate();
			this.replay.mark_complete();
		};
	}).call(Brawl.prototype);

	return Brawl;
});

