define(function(require, exports, module) {
	var PIXELS_PER_TILE = 5;

	var FPS = 5;
	var MS_PER_ROUND = 1000;

	var get_time = function() {
		return (new Date()).getTime();
	};

	function draw_map(map, ctx) {
		ctx.save();
		ctx.fillStyle = "rgb(0, 0, 100)";
		ctx.fillRect (0, 0, map.width, map.height);
		ctx.restore();
	}

	function draw_player(player, state, ctx) {
		ctx.save();

		ctx.translate(state.x, state.y);
		ctx.rotate(state.theta);
		ctx.fillStyle = "yellow";
		ctx.beginPath();
		ctx.arc(0, 0, player.radius, 0, Math.PI*2, true);
		ctx.fill();

		ctx.strokeStyle = "black";
		ctx.lineWidth = 1.0/PIXELS_PER_TILE;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(player.radius, 0);
		ctx.stroke();

		ctx.restore();
	}

	function draw_projectile(projectile, state, ctx) {
		ctx.save();

		ctx.translate(state.x, state.y);
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(0, 0, projectile.radius, 0, Math.PI*2, true);
		ctx.fill();

		ctx.restore();
	}

	var ReplayRenderer = function(replay) {
		this.replay = replay;
		this._destroy = false;
	};
	(function() {
		this.play = function(ctx) {
			this.start_time = get_time();
			this.snapshot_index = 0;
			
			this.render(ctx);
			var self = this;
			if(!this.replay.is_complete()) {
				this.replay.update();
			}
			this.replay_update_interval = window.setInterval(function() {
				if(!self.replay.is_complete()) {
					self.replay.update();
				}
			}, 1000);
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
			if(this._destroy === true) return;
			var self = this;
			window.setTimeout(function() {
				self.render(ctx);
			}, 1000/FPS);
		};
		this.do_render = function(ctx) {
			var time_diff = get_time() - this.start_time;
			var round = time_diff/MS_PER_ROUND;

			for(var i = this.snapshot_index, len = this.replay.num_snapshots(); i<len; i++) {
				var snapshot = this.replay.get_snapshot(i);
				if(snapshot == null) continue;

				if(snapshot.round > round) {
					this.snapshot_index = i-1;
					if(this.snapshot_index < 0) this.snapshot_index = 0;
					break;
				}
				else if(i >= len-1) {
					this.snapshot_index = len-1;
					break;
				}
			}
			this.render_snapshot(this.snapshot_index, ctx);
		};
		this.render_snapshot = function(snapshot_index, ctx) {
			var snapshot = this.replay.get_snapshot(snapshot_index);
			if(snapshot == null) return;
			var round = snapshot.round;

			ctx.save();
			ctx.scale(PIXELS_PER_TILE, PIXELS_PER_TILE);
			var map = this.replay.get_map();
			draw_map(map, ctx);
			for(var i = 0, len = snapshot.object_states.length; i<len; i++) {
				var object_index = i;
				if(snapshot.object_states[i] == null) continue;
				var object = this.replay.get_object(object_index);

				var object_state = snapshot.object_states[i];
				if(object.type === "player") {
					draw_player(object, object_state, ctx);
				}
				else if(object.type === "projectile") {
					draw_projectile(object, object_state, ctx);
				}
			}
			ctx.restore();
		};
		this.destroy = function() {
			this._destroy = true;
			window.clearInterval(this.replay_update_interval);
		};
	}).call(ReplayRenderer.prototype);

	return ReplayRenderer;
});
