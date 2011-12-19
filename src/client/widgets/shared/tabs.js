(function() {
	var TabPane = {
		options: {
			tabs: []
			default_tab: undefined
		}

		, _create: function() {
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.tab_pane", TabPane);
}());
