define(["vendor/jquery", "vendor/jquery-ui"], function() {
	var SidebarTeam = {
		options: {
			team: null
		}

		, _create: function() {
			var element = this.element,
				options = this.options,
				team = options.team;

			$(".weight_class", element).text(team.weight_class_name);
			$(element).click(function() {
				BrawlIO.db_do("view_team", team);
			});
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.sidebar_team", SidebarTeam);
});
