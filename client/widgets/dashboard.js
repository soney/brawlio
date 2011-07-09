define(["vendor/jquery", "vendor/jquery-ui", "vendor/handlebars"], function() {
	require(["client/widgets/sidebar_team"]);
	require(["client/widgets/dashboard_team"]);

	var Dashboard = {
		options: {
		}

		, _create: function() {
			this._initialize_templates();
			var element = this.element;

			element.html(this.dashboard_template());
		}

		, _initialize_templates: function() {
			var get_template = function(jq_query) {
				var template_html = $(jq_query).html();
				var template = Handlebars.compile(template_html);

				return template;
			};

			this.dashboard_template = get_template("script#dashboard_template");
			this.sidebar_team_template = get_template("script#sidebar_team_template");
			this.dashboard_team_template = get_template("script#dashboard_team_template");
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
				var weight_class_name = team.weight_class_name;
				
				var team_html = this.sidebar_team_template();
				var team_tag = $(team_html)

				teams_tag.append(team_tag);
				team_tag.sidebar_team({team: team});
			}
		}

		, view_team: function(team) {
			var element = this.element;
			var main_view = $(".main_view", element);

			if(main_view.data("dashboard_team")) {
				main_view.dashboard_team("destroy");
			}
			main_view.html("");
			main_view.dashboard_team({team: team});
		}
	};

	$.widget("brawlio.dashboard", Dashboard);
});
