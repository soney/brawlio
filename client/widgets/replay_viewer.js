define(["game/replay/replay_renderer", "vendor/jquery", "vendor/jquery-ui"], function(ReplayRenderer) {
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
			var renderer = new ReplayRenderer(replay);
			renderer.play(ctx);
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.replay_viewer", ReplayViewer);
});
