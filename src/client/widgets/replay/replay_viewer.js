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
			, debug: false
		}

		, _create: function() {
			var element = this.element;

			this.paper = Raphael(element[0], 1, 1);

			this.mode = mode.paused;

			this.initialize();

			this.set_mode(mode.playing);
			_.defer(_.bind(this.on_replay_chunk, this));
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

			replay.on("last_round_changed", this.on_replay_chunk, this);
			replay.on("complete", this.on_replay_chunk, this);
		}
		, on_replay_chunk: function() {
			if(this.mode === mode.stalled) {
				this.set_mode(mode.playing);
			}
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

			var played_percentage = this.round / this.max_rounds;
			this.progress_bar.set_played_percentage(played_percentage);
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
				this.set_mode(mode.paused);
			}
		}
		, set_mode: function(to_mode) {
			this.mode = to_mode;
			if(this.mode === mode.playing) {
				this.on_play();
			} else if(this.mode === mode.paused) {
				this.on_pause();
			} else if(this.mode === mode.at_end) {
				this.at_end();
			} else if(this.mode === mode.stalled) {
				this.on_stall();
			} else if(this.mode === mode.scrubbing_playing) {
				this.clear_update_interval();
			} else if(this.mode === mode.scrubbing_paused) {
				this.progress_bar.show_play_button();
				this.clear_update_interval();
			}
		}

		, on_scrub_start: function() {
			if(this.mode === mode.playing) {
				this.set_mode(mode.scrubbing_playing);
			} else if(this.mode === mode.paused) {
				this.set_mode(mode.scrubbing_paused);
			} else if(this.mode === mode.at_end) {
				this.set_mode(mode.scrubbing_paused);
			}
		}

		, on_scrub_stop: function() {
			if(this.mode === mode.scrubbing_playing) {
				this.set_mode(mode.playing);
			} else if(this.mode === mode.scrubbing_paused) {
				this.set_mode(mode.paused);
			}
		}

		, on_play: function() {
			this.progress_bar.show_pause_button();
			this.set_update_interval();
			this.snapshot_time(this.round);
		}

		, on_pause: function() {
			this.progress_bar.show_play_button();
			this.clear_update_interval();
		}
		
		, at_end: function() {
			this.progress_bar.show_rewind_button();
			this.clear_update_interval();
		}
		
		, on_stall: function() {
			this.progress_bar.show_play_button();
			this.clear_update_interval();
		}

		, set_update_interval: function() {
			var self = this;
			if(this.hasOwnProperty("__update_interval")) {
				this.clear_update_interval();
			} 
			this.__update_interval = window.setInterval(function() {
				self.update();
			}, 1000/this.option("fps"));
		}
		, clear_update_interval: function() {
			window.clearInterval(this.__update_interval);
			delete this.__update_interval;
		}
		, on_play_percentage_set: function(event) {
			var percentage = event.percentage;
			var round = this.max_rounds * percentage;
			this.set_round(round, false);
		}
		, set_round: function(round, set_progress_bar) {
			var replay = this.option("replay");
			var last_round = replay.get_last_round();
			var max_round = replay.get_max_rounds();
			var percentage = round / max_round;

			this.progress_bar.set_round_text("Round " + round.toFixed(1));

			this.round = round;
			if(set_progress_bar === true) {
				var played_percentage = this.round / this.max_rounds;
				this.progress_bar.set_played_percentage(played_percentage);
			}

			if(!replay.is_complete() && round >= last_round) {
				_.defer(_.bind(this.set_mode, this, mode.stalled));
			} else if(round >= max_round) {
				_.defer(_.bind(this.set_mode, this, mode.at_end));
			}
		}
		, update: function() {
			var round = this.get_round();
			this.set_round(round, true);
			this.render_round();
		}
		, play: function() {
			this.set_mode(mode.playing);
		}
		, render_round: function(round) {
			round = round || this.round;
		}
	};

	$.widget("brawlio.replay_viewer", ReplayViewer);
}(BrawlIO));
