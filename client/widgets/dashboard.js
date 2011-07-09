define(["vendor/jquery", "vendor/jquery-ui"], function() {
	require(["client/widgets/sidebar_team"]);
	require(["client/widgets/dashboard_team"]);

	var Dashboard = {
		options: {
		}

		, _create: function() {
			var element = this.element;

			element.html(BrawlIO.templates.dashboard());
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, set_username: function(username) {
			var element = this.element;
			$("#my_user_name", element).text(username);
		}

		, set_teams: function(teams) {
			var element = this.element,
				teams_tag = $(".teams", element);

			teams_tag.html("");
			for(var i = 0, len = teams.length; i<len; i++) {
				var team = teams[i];
				var team_id = team.id;

				var weight_class_name = team.weight_class_name;
				
				var team_html = BrawlIO.templates.sidebar_team();
				var team_tag = $(team_html)

				teams_tag.append(team_tag);
				team_tag.sidebar_team({team_id: team_id});
			}
			window.teams = teams;
		}

		, view_team: function(team_id) {
			var element = this.element;
			var main_view = $(".main_view", element);

			if(main_view.data("dashboard_team")) {
				main_view.dashboard_team("destroy");
			}
			main_view.dashboard_team({team_id: team_id});
		}
	};

	$.widget("brawlio.dashboard", Dashboard);
});
