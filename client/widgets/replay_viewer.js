define(["client/widgets/replay_renderer", "vendor/jquery", "vendor/jquery-ui"], function(ReplayRenderer) {
	var ReplayViewer = {
		options: {
			replay: undefined
		}

		, _create: function() {
			var element = this.element,
				options = this.options,
				replay = options.replay;

			var controls = $(".controls", element)
				, canvas = $("canvas", element);

			var ctx = canvas[0].getContext("2d");
			this.renderer = new ReplayRenderer(replay);
			this.renderer.play(ctx);
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
			this.renderer.destroy();
		}
	};

	$.widget("brawlio.replay_viewer", ReplayViewer);
});
