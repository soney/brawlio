(function(BrawlIO) {
	var _ = BrawlIO._;
	var game_constants = BrawlIO.game_constants;
	var PIXELS_PER_TILE = 8;
	var FPS = 30;

	var get_time = function() {
		return (new Date()).getTime();
	};

	function draw_map(map, ctx) {
		ctx.save();
		ctx.fillStyle = "rgb(0, 0, 100)";
		ctx.fillRect (0, 0, map.get_width(), map.get_height());
		ctx.restore();
	}

	function draw_player(player, state, ctx) {
		ctx.save();

		ctx.translate(state.position.x, state.position.y);
		ctx.rotate(state.position.theta);
		var color = player.get_team().get_id()===0 ? "yellow": "#777";
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(0, 0, player.get_radius(), 0, Math.PI*2, true);
		ctx.fill();

		ctx.strokeStyle = "black";
		ctx.lineWidth = 1.0/PIXELS_PER_TILE;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(player.get_radius(), 0);
		ctx.stroke();

		ctx.restore();
	}

	function draw_projectile(projectile, state, ctx) {
		ctx.save();

		ctx.translate(state.position.x, state.position.y);
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(0, 0, projectile.get_radius(), 0, Math.PI*2, true);
		ctx.fill();

		ctx.restore();
	}

	function draw_message(message, ctx) {
		ctx.save();
		ctx.restore();
	};

	var ReplayRenderer = function(replay, element) {
		this.replay = replay;
		this.element = element;
		this._destroy = false;
		this.initialize();
	};
	(function(my) {
		var proto = my.prototype;

		proto.initialize = function() {
			var map = this.replay.get_map();
			this.paper = Raphael(this.element, map.get_width() * PIXELS_PER_TILE, map.get_height() * PIXELS_PER_TILE);
			this.draw_map();
		};
		proto.play = function() {
			var self = this;
			window.setTimeout(function() {
				self.start_time = get_time();
				self.snapshot_index = 0;
				
				self.render();
			}, 0);
		};
		proto.stop = function() { };
		proto.draw_map = function() {
			var map = this.replay.get_map();
			this.paper.rect(0, 0, map.get_width(), map.get_height(), 1).attr({
				fill: "#337"
			}).scale(PIXELS_PER_TILE, PIXELS_PER_TILE, 0, 0);
		};
		proto.get_round = function() {
			var time_diff = get_time() - this.start_time;
			var round = time_diff/game_constants.REPLAY_MS_PER_ROUND;
			return round;
		};
		proto.render = function() {
			//this.do_render();
			if(this.replay.is_complete() && this.get_round() >= this.replay.get_num_rounds()) {
				this.stop();
				return;
			}
			if(this._destroy === true) { return; }
			var self = this;
			window.setTimeout(function() {
				self.render();
			}, 1000/FPS);
		};
		proto.do_render = function(ctx) {
			var round = this.get_round();
			var snapshot = this.replay.get_snapshot_at(round);
			this.render_snapshot(snapshot, ctx);
		};
		proto.render_snapshot = function(snapshot, ctx) {
			ctx.save();
			ctx.scale(PIXELS_PER_TILE, PIXELS_PER_TILE);
			var map = this.replay.get_map();
			draw_map(map, ctx);
			var self = this;
			_.forEach(snapshot.moving_object_states, function(moving_object_state) {
				var moving_object = moving_object_state.moving_object;
				if(moving_object.is("player")) {
					draw_player(moving_object, moving_object_state, ctx);
				} else if(moving_object.is("projectile")) {
					draw_projectile(moving_object, moving_object_state, ctx);
				}
			});
			ctx.restore();
		};
		proto.destroy = function() {
			this._destroy = true;
		};
	}(ReplayRenderer));

	BrawlIO.define_factory("replay_renderer", function(replay, element) {
		return new ReplayRenderer(replay, element);
	});
}(BrawlIO));
