(function(BrawlIO) {
	var _ = BrawlIO._;
	var mode = {
		paused: 0
		, playing: 1
		, at_end: 2
		, scrubbing_paused: 3
		, scrubbing_playing: 4
		, stalled: 5
	};

	var ReplayViewer = {
		options: {
			replay: undefined
			, pixels_per_tile: 8 
			, minimized_scrub_height: 2
			, maximized_scrub_height: 10
			, control_height: 20
			, fps: 30
		}

		, _create: function() {
			var element = this.element;

			this.paper = Raphael(element[0], 1, 1);

			this.mode = mode.paused;

			this.initialize();
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
			this.paper.clear();
		}

		, initialize: function() {
			var replay = this.option("replay")
				, pixels_per_tile = this.option("pixels_per_tile")
				, minimized_scrub_height = this.option("minimized_scrub_height")
				, control_height = this.option("control_height");
			var map = replay.get_map()
				, map_width = map.get_width()
				, map_height = map.get_height();
			this.paper.setSize(map_width * pixels_per_tile, map_height * pixels_per_tile + minimized_scrub_height);

			this.paper.rect(0, 0, map_width * pixels_per_tile, map_height * pixels_per_tile, 0).attr({
				fill: "#337"
				, stroke: "none"
			});
			this.progress_bar = BrawlIO.create_replay_control_bar({
				paper: this.paper
				, minimized_scrub_height: this.option("minimized_scrub_height")
				, maximized_scrub_height: this.option("maximized_scrub_height")
				, control_height: this.option("control_height")
				, width: map_width * pixels_per_tile
				, bottom: map_height * pixels_per_tile + minimized_scrub_height
				, element: this.element
			});
			this.progress_bar.on("play_button_click", this.on_play_button_click, this);
			this.progress_bar.on("played_percentage_set", this.on_play_percentage_set, this);
			this.progress_bar.on("scrub_start", this.on_scrub_start, this);
			this.progress_bar.on("scrub_stop", this.on_scrub_stop, this);
			this.set_round(0);
			this.update_loaded_percentage();
		}
		, update_loaded_percentage: function() {
			var replay = this.option("replay");
			var max_rounds = replay.get_max_rounds();
			this.progress_bar.set_max_text("/"+max_rounds.toFixed(1));
			var loaded_rounds = replay.get_last_round();

			var loaded_percentage = loaded_rounds / max_rounds;
			this.progress_bar.set_loaded_percentage(loaded_percentage)

			this.max_rounds = max_rounds;
		}
		, snapshot_time: function(round) {
			this.last_update_round = round || 0;
			this.last_update_time = BrawlIO.get_time();
		}
		, get_round: function(time) {
			time = time || BrawlIO.get_time();
			var time_diff = time - this.last_update_time;
			var round_diff = time_diff/BrawlIO.game_constants.REPLAY_MS_PER_ROUND;
			return this.last_update_round + round_diff;
		}
		, on_play_button_click: function() {
			if(this.mode === mode.paused) {
				this.set_mode(mode.playing);
			} else if(this.mode === mode.playing) {
				this.set_mode(mode.paused);
			} else if(this.mode === mode.at_end) {
				this.set_round(0);
				this.set_mode(mode.playing);
			} else if(this.mode === mode.stalled) {
			}
		}
		, set_mode: function(to_mode) {
			this.mode = to_mode;
			if(this.mode === mode.playing) {
				this.play();
			} else if(this.mode === mode.paused) {
				this.pause();
			} else if(this.mode === mode.at_end) {
				this.at_end();
			} else if(this.mode === mode.stalled) {

			}
		}

		, on_scrub_start: function() {
			console.log("scrub start");
			if(this.mode === mode.playing) {
			}
		}

		, on_scrub_stop: function() {
			console.log("scrub stop");
		}

		, play: function() {
			this.progress_bar.show_pause_button();
			this.set_update_interval();
			this.snapshot_time(this.round);
		}

		, pause: function() {
			this.progress_bar.show_play_button();
			this.clear_update_interval();
		}
		
		, at_end: function() {
			this.progress_bar.show_rewind_button();
			this.clear_update_interval();
		}
		
		, on_stall: function() {
			this.clear_update_interval();
			this.progress_bar.show_play_button();
		}

		, set_update_interval: function() {
			var self = this;
			this.__update_interval = window.setInterval(function() {
				self.update();
			}, 1000/this.option("fps"));
		}
		, clear_update_interval: function() {
			window.clearInterval(this.__update_interval);
		}
		, on_play_percentage_set: function(event) {
			var percentage = event.percentage;
			var round = this.max_rounds * percentage;
			this.set_round(round, false);
		}
		, set_round: function(round, set_progress_bar) {
			var replay = this.option("replay");
			var max_round = replay.get_max_rounds();
			var percentage = round / max_round;

			this.progress_bar.set_round_text("Round " + round.toFixed(1));

			this.round = round;
			if(set_progress_bar === true) {
				var played_percentage = round / this.max_rounds;
				this.progress_bar.set_played_percentage(played_percentage);
			}

			if(round >= max_round) {
				if(replay.is_complete()) {
					this.set_mode(mode.at_end);
				} else {
					this.set_mode(mode.stalled);
				}
			}
		}
		, update: function() {
			var round = this.get_round();
			this.set_round(round, true);
		}
	};

	$.widget("brawlio.replay_viewer", ReplayViewer);
}(BrawlIO));
