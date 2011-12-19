(function(BrawlIO) {
	var DashboardBot = {
		options: {
			dashboard: undefined
			, bot: undefined
		}

		, _create: function() {
			var element = this.element;
			var dashboard = this.option("dashboard");
			var bot = this.option("bot");
			this.botname_display = $("<div />")	.append(
													$("<a />")	.attr("href", "javascript:void(0)")
																.click(function() {
																	dashboard.render_home();
																})
																.text(BrawlIO.user.username)
												)
												.append("/")
												.append(
													$("<a />")	.attr("href", "javascript:void(0)")
																.click(function() {
																	dashboard.render_bot(bot);
																})
																.text(bot.name)
												)
												.addClass("username")
												.appendTo(element);
		}

		, destroy: function() {
			var element = this.element;
			this.botname_display.remove();

			$.Widget.prototype.destroy.apply(this, arguments);
		}

	};

	$.widget("brawlio.dashboard_bot", DashboardBot);
}(BrawlIO));
