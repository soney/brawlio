define(function(require, exports, module) {
	var PIXELS_PER_TILE = 8;

	var FPS = 30;
	var MS_PER_ROUND = 1000;

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

		ctx.translate(state.x, state.y);
		ctx.rotate(state.theta);
		ctx.fillStyle = "yellow";
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

		ctx.translate(state.x, state.y);
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(0, 0, projectile.get_radius(), 0, Math.PI*2, true);
		ctx.fill();

		ctx.restore();
	}

	var ReplayRenderer = function(replay) {
		this.replay = replay;
		this._destroy = false;
	};
	(function() {
		this.play = function(ctx) {
			var self = this;
			window.setTimeout(function() {
				self.start_time = get_time();
				self.snapshot_index = 0;
				
				self.render(ctx);
			}, 1000);
			/*
			this.start_time = get_time();
			this.snapshot_index = 0;
			
			this.render(ctx);
			*/
		};
		this.stop = function() {
			console.log("Replay done");
		};
		this.render = function(ctx) {
			this.do_render(ctx);
			if(this.replay.is_complete() && this.snapshot_index >= this.replay.num_snapshots() - 1) {
				this.stop();
				return;
			}
			if(this._destroy === true) { return; }
			var self = this;
			window.setTimeout(function() {
				self.render(ctx);
			}, 1000/FPS);
		};
		this.do_render = function(ctx) {
			var time_diff = get_time() - this.start_time;
			var round = time_diff/MS_PER_ROUND;
			var snapshot = this.replay.get_snapshot_at(round);
			this.render_snapshot(snapshot, ctx);
		};
		this.render_snapshot = function(snapshot, ctx) {
			ctx.save();
			ctx.scale(PIXELS_PER_TILE, PIXELS_PER_TILE);
			var map = this.replay.get_map();
			draw_map(map, ctx);
			var self = this;
			snapshot.players.forEach(function(player_state) {
				var player = player_state.player;
				draw_player(player, player_state, ctx);
			});
			snapshot.projectiles.forEach(function(projectile_state) {
				var projectile = projectile_state.projectile;
				draw_projectile(projectile, projectile_state, ctx);
			});
			ctx.restore();
		};
		this.destroy = function() {
			this._destroy = true;
		};
	}).call(ReplayRenderer.prototype);

	return ReplayRenderer;
});
