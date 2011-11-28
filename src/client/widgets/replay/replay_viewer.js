(function(BrawlIO) {
	var _ = BrawlIO._;

	var ReplayViewer = {
		options: {
			replay: undefined
			, pixels_per_tile: 8 
			, minimized_scrub_height: 2
			, maximized_scrub_height: 10
			, control_height: 20
		}

		, _create: function() {
			var element = this.element;

			this.paper = Raphael(element[0], 1, 1);

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
			this.progress_bar.set_round_text("Round 20");
			this.progress_bar.set_max_text("/40");
		}
	};

	$.widget("brawlio.replay_viewer", ReplayViewer);
}(BrawlIO));
