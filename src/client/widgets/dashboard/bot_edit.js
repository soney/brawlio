(function(BrawlIO) {
	var BotEdit = {
		options: {
			dashboard: undefined
		}

		, _create: function() {
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}

	};

	$.widget("brawlio.bot_edit", BotEdit);
}(BrawlIO));
