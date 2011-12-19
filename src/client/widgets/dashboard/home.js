(function(BrawlIO) {
	var DashboardHome = {
		options: {
			dashboard: undefined
		}

		, _create: function() {
			var element = this.element;
			var dashboard = this.option("dashboard");
			this.username_display = $("<div />")	.append(
														$("<a />")	.attr("href", "javascript:void(0)")
																	.click(function() {
																		dashboard.render_home();
																	})
																	.text(BrawlIO.user.username)
													)
													.addClass("username")
													.appendTo(element);
			
			this.sidebar = $("<div />")	.addClass("sidebar")
										.appendTo(element);

			this.content = $("<div />")	.addClass("content")
										.appendTo(element);

			this.bot_list = $("<div />")	.bot_list({
												dashboard: dashboard
											})
											.appendTo(this.sidebar);

			/*
			this.team_list = $("<div />")	.addClass("team_list")
											.text("(teams)")
											.appendTo(this.sidebar);
											*/

			/*
			this.news_feed = $("<div />")	.addClass("news_feed")
											.text("(news)")
											.appendTo(this.content);
											*/
		}

		, destroy: function() {
			var element = this.element;
			this.username_display.remove();

			this.bot_list.bot_list("destroy");
			this.bot_list.remove();

			$.Widget.prototype.destroy.apply(this, arguments);
		}

	};

	$.widget("brawlio.dashboard_home", DashboardHome);
}(BrawlIO));
