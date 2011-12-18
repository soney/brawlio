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
		}

		, destroy: function() {
			var element = this.element;
			this.username_display.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}

	};

	$.widget("brawlio.dashboard_home", DashboardHome);
}(BrawlIO));
