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
			this.sprites = [];

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
				this.progress_bar.show_pause_button();
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

			round = Math.min(round, last_round);

			var percentage = round / max_round;

			this.progress_bar.set_round_text("Round " + round.toFixed(1));

			this.round = round;
			if(set_progress_bar === true) {
				var played_percentage = this.round / this.max_rounds;
				this.progress_bar.set_played_percentage(played_percentage);
			}

			if(!replay.is_complete() && round >= last_round && this.mode === mode.playing) {
				_.defer(_.bind(this.set_mode, this, mode.stalled));
			} else if(round >= max_round && this.mode === mode.playing) {
				_.defer(_.bind(this.set_mode, this, mode.at_end));
			}
			this.render_round(round);
		}
		, update: function() {
			var round = this.get_round();
			this.set_round(round, true);
		}
		, play: function() {
			this.set_mode(mode.playing);
		}
		, render_round: function(round) {
			var replay = this.option("replay");
			round = round || this.round;

			var snapshot = replay.get_snapshot_at(round);

			var moving_objects = _.pluck(snapshot.moving_object_states, "moving_object");
			var positions = _.pluck(snapshot.moving_object_states, "position");

			var visible_sprites = _.map(moving_objects, function(moving_object, index) {
				var sprite = this.get_sprite_for(moving_object);
				var position = positions[index];
				sprite.show();
				sprite.set_position(position);
				return sprite;
			}, this);
			var hidden_sprites = _.difference(this.sprites, visible_sprites);

			_.forEach(hidden_sprites, function(sprite) {
				sprite.hide();
			});
		}

		, get_sprite_for: function(moving_object) {
			var i, len = this.sprites.length;
			var rv, sprite;
			for(i = 0; i<len; i++) {
				sprite = this.sprites[i];
				if(sprite.describes(moving_object)) {
					rv = sprite;
					break;
				}
			}
			if(rv === undefined) {
				if(moving_object.is("player")) {
					rv = create_player_widget({
						moving_object: moving_object
						, paper: this.paper
						, pixels_per_tile: this.option("pixels_per_tile")
					});
				} else if(moving_object.is("projectile")) {
					rv = create_projectile_widget({
						moving_object: moving_object
						, paper: this.paper
						, pixels_per_tile: this.option("pixels_per_tile")
					});
				}
				this.progress_bar.toFront();
				this.sprites.push(rv);
			}

			return rv;
		}
	};

	var PlayerWidget = function(options) {
		this.moving_object = options.moving_object;
		this.paper = options.paper;
		this.pixels_per_tile = options.pixels_per_tile;
		this.create();
	};
	(function(my) {
		var proto = my.prototype;
		proto.create = function() {
			var radius = this.moving_object.get_radius();
			
			this.paper.setStart();
			this.circle = this.paper.circle(0, 0, radius).attr({
				fill: "yellow"
				, stroke: "black"
			});
			this.line = this.paper.path("M0,0L"+radius+",0").attr({
				stroke: "black"
			});
			this.set = this.paper.setFinish();

			var ppt = this.pixels_per_tile;
			this.set.attr("transform", "S"+ppt+","+ppt+",0,0");
		};
	}(PlayerWidget));

	var ProjectileWidget = function(options) {
		this.moving_object = options.moving_object;
		this.paper = options.paper;
		this.pixels_per_tile = options.pixels_per_tile;
		this.create();
	};
	(function(my) {
		var proto = my.prototype;
		proto.create = function() {
			var radius = this.moving_object.get_radius();
			
			this.paper.setStart();
			this.circle = this.paper.circle(0, 0, radius).attr({
				fill: "red"
			});
			this.set = this.paper.setFinish();
		};
	}(ProjectileWidget));

	_.forEach([PlayerWidget, ProjectileWidget], function(my) {
		var proto = my.prototype;
		proto.hide = function() {
			this.set.hide();
		};
		proto.show = function() {
			this.set.show();
		};
		proto.describes = function(mo) {
			return this.moving_object === mo;
		};
		proto.set_position = function(position) {
			var ppt = this.pixels_per_tile;
			var x = position.x * this.pixels_per_tile;
			var y = position.y * this.pixels_per_tile;
			var deg = Raphael.deg(position.theta);
			this.set.attr("transform", "S"+ppt+","+ppt+",0,0R"+deg+",0,0T"+x+","+y);
		};
	});

	var create_player_widget = function(options) { return new PlayerWidget(options); };
	var create_projectile_widget = function(options) { return new ProjectileWidget(options); };

	$.widget("brawlio.replay_viewer", ReplayViewer);
}(BrawlIO));
