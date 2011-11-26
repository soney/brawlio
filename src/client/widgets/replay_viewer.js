(function(BrawlIO) {
	var ReplayViewer = {
		options: {
			replay: undefined
		}

		, _create: function() {
			var element = this.element,
				options = this.options,
				replay = options.replay;

			var controls = $(".controls", element)
				, canvas = $("#canvas", element);

			this.renderer = BrawlIO.create("replay_renderer", replay, canvas[0]);
			this.renderer.play();
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
			this.renderer.destroy();
			this.clear_result();
		}
		
		, set_result: function(text) {
			$(".result", this.element).text(text);
		}

		, clear_result: function() {
			return this.set_result("");
		}
	};

	$.widget("brawlio.replay_viewer", ReplayViewer);
}(BrawlIO));
