define(["vendor/jquery", "vendor/jquery-ui", "client/widgets/team/team_tester"], function() {
	require(["client/widgets/team/team_editor"]);

	var DashboardUser = {
		options: {
			user_id: undefined
		}

		, _create: function() {
			var element = this.element,
				options = this.options,
				user = BrawlIO.get_user_by_id(options.user_id);

			element.html("User: " + user.username);
			var logout = $("<a />")	.attr("href", "/logout")
									.text("logout")
									.appendTo(element);
			
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

	};

	$.widget("brawlio.dashboard_user", DashboardUser);
});
