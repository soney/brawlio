define(["vendor/jquery", "vendor/jquery-ui"], function() {
	var SidebarTeam = {
		options: {
			team_id: null
		}

		, _create: function() {
			var element = this.element
				, options = this.options
				, team_id = options.team_id
				, team = BrawlIO.get_team_by_id(team_id);

			$(".weight_class", element).text(team.weight_class_name);
			$(element).click(function() {
				BrawlIO.db_do("view_team", team_id);
			});
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.sidebar_team", SidebarTeam);
});
