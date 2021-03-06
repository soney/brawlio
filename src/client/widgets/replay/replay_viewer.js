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
			game_log: undefined
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
			if(this.hasOwnProperty("spinner_remove")) {
				this.spinner_remove();
				delete this.spinner_remove;
			}
			_.forEach(this.sprites, function(sprite) {
				sprite.stop();
			});
			this.clear_update_interval();
			this.progress_bar.destroy();
			this.paper.remove();

			$.Widget.prototype.destroy.apply(this, arguments);
		}
		, get_width: function() {
			var game_log = this.option("game_log");
			var map = game_log.get_map()
				, pixels_per_tile = this.option("pixels_per_tile")
				, map_width = map.get_width();
			return map_width * pixels_per_tile;
		}

		, get_height: function() {
			var game_log = this.option("game_log");
			var map = game_log.get_map()
				, pixels_per_tile = this.option("pixels_per_tile")
				, map_height = map.get_height();
			return map_height * pixels_per_tile;
		}

		, initialize: function() {
			var game_log = this.option("game_log")
				, pixels_per_tile = this.option("pixels_per_tile")
				, minimized_scrub_height = this.option("minimized_scrub_height")
				, control_height = this.option("control_height");
			var map = game_log.get_map()
				, map_width = map.get_width()
				, map_height = map.get_height();
			this.paper.setSize(map_width * pixels_per_tile, map_height * pixels_per_tile + minimized_scrub_height);

			this.paper.rect(0, 0, map_width * pixels_per_tile, map_height * pixels_per_tile, 0).attr({
				fill: this.option("debug") ? "#222" : "#337"
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

			game_log.on("last_round_changed", this.on_replay_chunk, this);
			game_log.on("complete", this.on_replay_chunk, this);
		}
		, on_replay_chunk: function() {
			if(this.mode === mode.stalled) {
				this.set_mode(mode.playing);
			}
			this.update_loaded_percentage();
		}
		, update_loaded_percentage: function() {
			var game_log = this.option("game_log");
			var max_rounds = game_log.get_max_rounds();
			this.progress_bar.set_max_text("/"+max_rounds.toFixed(1));
			var loaded_rounds = game_log.get_last_round();

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
			var from_mode = this.mode;

			if(from_mode === mode.at_end) {
				this.remove_result();
			} else if(from_mode === mode.stalled) {
				if(this.hasOwnProperty("spinner_remove")) {
					this.spinner_remove();
					delete this.spinner_remove;
				}
			}

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
			var game_log = this.option("game_log");
			var max_round = game_log.get_max_rounds();
			var round = this.round;
			if(game_log.is_complete() && round >= max_round) {
				this.set_mode(mode.at_end);
				var winner = game_log.get_winner();
				this.render_result(winner);
			} else if(this.mode === mode.scrubbing_playing) {
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
			this.spinner_remove = spinner(this.paper, this.get_width()/2, this.get_height()/2, 70, 120, 12, 25, "#FFF");
		}

		, set_update_interval: function() {
			var self = this;
			this.clear_update_interval();
			this.__update_interval = setInterval(function() {
				self.update();
			}, 1000/this.option("fps"));
		}
		, clear_update_interval: function() {
			if(this.hasOwnProperty("__update_interval")) {
				clearInterval(this.__update_interval);
				delete this.__update_interval;
			}
		}
		, on_play_percentage_set: function(event) {
			var percentage = event.percentage;
			var round = this.max_rounds * percentage;
			this.set_round(round, false);
		}
		, set_round: function(round, set_progress_bar) {
			var game_log = this.option("game_log");
			var last_round = game_log.get_last_round();
			var max_round = game_log.get_max_rounds();

			round = Math.min(round, last_round);

			var percentage = round / max_round;

			this.progress_bar.set_round_text("Round " + round.toFixed(1));

			this.round = round;
			if(set_progress_bar === true) {
				var played_percentage = this.round / this.max_rounds;
				this.progress_bar.set_played_percentage(played_percentage);
			}


			if(round >= max_round && this.mode === mode.playing) {
				var winner = game_log.get_winner();
				this.render_result(winner);
			} else {
				this.render_round(round);
			}

			if(!game_log.is_complete() && round >= last_round && this.mode === mode.playing) {
				_.defer(_.bind(this.set_mode, this, mode.stalled));
			} else if(round >= max_round && this.mode === mode.playing) {
				_.defer(_.bind(this.set_mode, this, mode.at_end));
			}
		}
		, update: function() {
			var round = this.get_round();
			this.set_round(round, true);
		}
		, play: function() {
			this.set_mode(mode.playing);
		}
		, render_round: function(round) {
			var game_log = this.option("game_log");
			round = round || this.round;

			var snapshot = game_log.get_snapshot_at(round);

			var visible_sprites = _.map(snapshot.moving_object_states, function(moving_object_state) {
				var moving_object = moving_object_state.moving_object;
				var sprite = this.get_sprite_for(moving_object);
				var position = moving_object_state.position;
				var health = moving_object_state.health;
				var path = moving_object_state.path;
				sprite.show();
				sprite.set_position(position);
				sprite.set_path(path);
				if(moving_object.is("player")) {
					sprite.set_health(health)
				}
				return sprite;
			}, this);

			var hidden_sprites = _.difference(this.sprites, visible_sprites);

			_.forEach(hidden_sprites, function(sprite) {
				sprite.hide();
			});
		}

		, render_result: function(winner) {
			var game_log = this.option("game_log")
			var map = game_log.get_map()
				, map_width = map.get_width()
				, map_height = map.get_height()
				, pixels_per_tile = this.option("pixels_per_tile");
			var result_text;
			if(winner === undefined) {
				result_text = "Tie";
			} else {
				result_text = winner.get_win_text();
			}

			this.remove_result();

			this.paper.setStart();
			var height = map_height * pixels_per_tile;
			this.paper.rect(0, (map_height * pixels_per_tile - height)/2, map_width * pixels_per_tile, height).attr({
				"fill": "black", "fill-opacity": 0.4, "stroke": "none"
			});
			this.paper.text((map_width * pixels_per_tile)/2, (map_height * pixels_per_tile)/2, result_text).attr({
				"font-size": "32pt", fill: "white"
			});
			this.result_display = this.paper.setFinish();
			this.progress_bar.toFront();
		}

		, remove_result: function() {
			if(this.hasOwnProperty("result_display")) {
				this.result_display.remove();
				delete this.result_display;
			}
		}

		, get_sprite_for: function(moving_object) {
			var game_log = this.option("game_log");
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
					var team = moving_object.get_team();
					var map = game_log.get_map();
					rv = create_player_widget({
						moving_object: moving_object
						, paper: this.paper
						, pixels_per_tile: this.option("pixels_per_tile")
						, color: team.get_color_for_player(moving_object)
						, map_height: map.get_height()
						, debug: this.option("debug")
					});
				} else if(moving_object.is("projectile")) {
					rv = create_projectile_widget({
						moving_object: moving_object
						, paper: this.paper
						, pixels_per_tile: this.option("pixels_per_tile")
						, debug: this.option("debug")
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
		this.color = options.color;
		this.debug = options.debug;
		this.map_height = options.map_height;
		this.create();
	};
	(function(my) {
		var proto = my.prototype;
		var health_height = 4;
		proto.create = function() {
			var radius = this.moving_object.get_radius();
			var ppt = this.pixels_per_tile;
			
			this.paper.setStart();
			this.circle = this.paper.circle(0, 0, radius).attr({
				fill: this.debug ? "none" : this.color, stroke: this.debug ? this.color : "black"
			});
			this.line = this.paper.path("M0,0L"+radius+",0").attr({
				stroke: this.debug ? this.color : "black"
			});
			this.set = this.paper.setFinish();

			var ppt = this.pixels_per_tile;
			this.set.attr("transform", "S"+ppt+","+ppt+",0,0");

			this.paper.setStart();
			this.health_outline = this.paper.rect(-radius, radius+health_height/ppt, 2*radius, health_height/ppt).attr({
				fill: "none", stroke: "white", "stroke-opacity": 0.4
			});
			this.health_fill = this.paper.rect(-radius, radius+health_height/ppt, 2*radius, health_height/ppt).attr({
				fill: "red", stroke: "none", "fill-opacity": 0.3
			});
			this.health = this.paper.setFinish();

			if(this.is_debug()) {
				this.movement_path = this.paper.path("").attr({
					fill: "none", stroke: this.color, "stroke-dasharray": "- ", "stroke-opacity": 0.2
				});
			}
		};
		proto.set_position = function(position) {
			var ppt = this.pixels_per_tile;
			var x = position.x * ppt;
			var y = position.y * ppt;
			var deg = Raphael.deg(position.theta);
			this.set.attr("transform", "S"+ppt+","+ppt+",0,0R"+deg+",0,0T"+x+","+y);
			this.health.attr("transform", "S"+ppt+","+ppt+",0,0T"+x+","+y);
		};
		proto.set_health = function(health) {
			if(this.__last_health === health) {
				return;
			} else {
				this.__last_health = health;
			}
			var player = this.moving_object;
			var health_percentage = Math.max(health / player.get_max_health(), 0);
			var radius = this.moving_object.get_radius();
			var width = 2*radius*health_percentage;
			this.health_fill.animate({
				width: width
			}, 90, "ease-out");
		};
		proto.stop = function() {
			this.health_fill.stop();
		};
		proto.hide = function() {
			this.set.hide();
			this.health.hide();
			if(this.is_debug()) {
				this.movement_path.hide();
			}
		};
		proto.show = function() {
			this.set.show();
			this.health.show();
			if(this.is_debug()) {
				this.movement_path.show();
			}
		};
	}(PlayerWidget));

	var ProjectileWidget = function(options) {
		this.moving_object = options.moving_object;
		this.paper = options.paper;
		this.pixels_per_tile = options.pixels_per_tile;
		this.debug = options.debug;
		this.create();
	};
	(function(my) {
		var proto = my.prototype;
		proto.stop = function() {
		};
		proto.create = function() {
			var radius = this.moving_object.get_radius();
			
			this.paper.setStart();
			this.circle = this.paper.circle(0, 0, radius).attr({
				fill: this.debug ? "none" : "red", stroke: this.debug ? "red" : "none"
			});
			this.set = this.paper.setFinish();

			if(this.is_debug()) {
				this.movement_path = this.paper.path("").attr({
					fill: "none", stroke: "red", "stroke-dasharray": ". ", "stroke-opacity": 0.2
				});
			}
		};
		proto.set_position = function(position) {
			var ppt = this.pixels_per_tile;
			var x = position.x * this.pixels_per_tile;
			var y = position.y * this.pixels_per_tile;
			var deg = Raphael.deg(position.theta);
			this.set.attr("transform", "S"+ppt+","+ppt+",0,0R"+deg+",0,0T"+x+","+y);
		};
		proto.hide = function() {
			this.set.hide();
			if(this.is_debug()) {
				this.movement_path.hide();
			}
		};
		proto.show = function() {
			this.set.show();
			if(this.is_debug()) {
				this.movement_path.show();
			}
		};
	}(ProjectileWidget));

	_.forEach([PlayerWidget, ProjectileWidget], function(my) {
		var proto = my.prototype;
		proto.describes = function(mo) {
			return this.moving_object === mo;
		};
		proto.is_debug = function() {
			return this.debug === true;
		};
		proto.set_path = function(path) {
			if(this.is_debug()) {
				if(this.for_path === path) {
					return;
				} else {
					this.for_path = path;
				}
				var line_path = "";
				if(path.is("constant_velocity_line")) {
					var angle = path.angle;
					var distance = Math.max(this.paper.width, this.paper.height);
					var ppt = this.pixels_per_tile;
					var x0 = path.x0 * ppt, y0 = path.y0 * ppt
						, x1 = x0 + distance * Math.cos(angle) * ppt
						, y1 = y0 + distance * Math.sin(angle) * ppt;
					line_path = "M"+x0+","+y0+"L"+x1+","+y1;
				} else if(path.is("constant_velocity_circle")) {
					var ppt = this.pixels_per_tile;
					var x0 = path.x0*ppt, y0 = path.y0*ppt
							 , movement_angle = path.movement_angle, r = path.r*ppt, clockwise = path.clockwise;
					var sweep_flag = clockwise ? 1 : 0;
					var opposing_angle = movement_angle + (clockwise ? Math.PI/2 : -Math.PI/2);
					var x1 = x0 + 2*r*Math.cos(opposing_angle)
						, y1 = y0 + 2*r*Math.sin(opposing_angle)

					line_path = "M"+x0+","+y0+
								"A"+r+","+r+" 0 0,"+sweep_flag+" "+x1+","+y1+
								"A"+r+","+r+" 0 1,"+sweep_flag+" "+x0+","+y0;
				} else if(path.is("sinusoidal_velocity_line")) {
					var line_segment = path.get_line_segment_range();
					var ppt = this.pixels_per_tile;
					var x0 = ppt*line_segment.p0.x, y0 = ppt*line_segment.p0.y
						, x1 = ppt*line_segment.p1.x, y1 = ppt*line_segment.p1.y;
					line_path = "M"+x0+","+y0+"L"+x1+","+y1;
				}

				this.movement_path.attr("path", line_path);
			}
		};
	});

	var create_player_widget = function(options) { return new PlayerWidget(options); };
	var create_projectile_widget = function(options) { return new ProjectileWidget(options); };

	$.widget("brawlio.replay_viewer", ReplayViewer);

	//Source: http://raphaeljs.com/spin-spin-spin.html
	function spinner(paper, cx, cy, R1, R2, count, stroke_width, colour) {
		var sectorsCount = count || 12,
			color = colour || "#fff",
			width = stroke_width || 15,
			r1 = Math.min(R1, R2) || 35,
			r2 = Math.max(R1, R2) || 60,
			//cx = r2 + width,
			//cy = r2 + width,
			r = paper, //Raphael(holderid, r2 * 2 + width * 2, r2 * 2 + width * 2),
			
			sectors = [],
			opacity = [],
			beta = 2 * Math.PI / sectorsCount,

			pathParams = {stroke: color, "stroke-width": width, "stroke-linecap": "round"};
			Raphael.getColor.reset();
		for (var i = 0; i < sectorsCount; i++) {
			var alpha = beta * i - Math.PI / 2,
				cos = Math.cos(alpha),
				sin = Math.sin(alpha);
			opacity[i] = 1 / sectorsCount * i;
			sectors[i] = r.path([["M", cx + r1 * cos, cy + r1 * sin], ["L", cx + r2 * cos, cy + r2 * sin]]).attr(pathParams);
			if (color == "rainbow") {
				sectors[i].attr("stroke", Raphael.getColor());
			}
		}
		var tick;
		(function ticker() {
			opacity.unshift(opacity.pop());
			for (var i = 0; i < sectorsCount; i++) {
				sectors[i].attr("opacity", opacity[i]);
			}
			r.safari();
			tick = setTimeout(ticker, 1000 / sectorsCount);
		})();
		return function () {
			clearTimeout(tick);
			for(var i = 0; i<sectors.length; i++) {
				var sector = sectors[i];
				sector.remove();
			}
			//r.remove();
		};
	}
}(BrawlIO));
