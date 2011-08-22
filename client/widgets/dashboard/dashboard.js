define(["vendor/jquery", "vendor/jquery-ui", "client/widgets/dashboard/sidebar/sidebar_team"], function() {
	require(["client/widgets/dashboard/dashboard_team"]);
	require(["client/widgets/dashboard/dashboard_user"]);

	var Dashboard = {
		options: {
		}

		, _create: function() {
			var element = this.element;
			$("#editor", element).team_editor();

//			element.html(BrawlIO.templates.dashboard());
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, set_username: function(username) {
			var element = this.element;
			$("a#dashboard").click(function() {
				BrawlIO.db_do("view_user");
			});
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
				
				var team_html = BrawlIO.templates.sidebar_team({weight_class_name: weight_class_name});
				var team_tag = $(team_html)

				teams_tag.append(team_tag);
				team_tag.sidebar_team({team_id: team_id});
			}
			window.teams = teams;
		}

		, view_team: function(team_id) {
			var main_view = this._destroy_main_view();
			main_view.dashboard_team({team_id: team_id});
		}

		, view_user: function(user_id) {
			var main_view = this._destroy_main_view();
			main_view.dashboard_user({user_id: user_id});
		}

		, _destroy_main_view: function() {
			var element = this.element;
			var main_view = $(".main_view", element);

			if(main_view.data("dashboard_team")) {
				main_view.dashboard_team("destroy");
			}
			if(main_view.data("dashboard_user")) {
				main_view.dashboard_user("destroy");
			}
			return main_view;
		}
	};

	$.widget("brawlio.dashboard", Dashboard);
});
