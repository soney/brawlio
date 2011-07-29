define(function(require, exports, module) {
	require(["vendor/handlebars"]);
	require(["client/widgets/dashboard"]);
	require(["client/widgets/replay_viewer"]);

	var BrawlIO = window.BrawlIO = {
		_debug: true
	};

	BrawlIO.assert = function(test, message) {
		if(BrawlIO._debug) {
			console.assert(test, message);
		}
	};

	(function() {
		this.initialize = function(key, dashboard_tag) {
			this.initialize_templates();
			this.dashboard_tag = dashboard_tag;
			this.dashboard_tag.dashboard();

			this.initialize_socket(key);
		};

		this.initialize_templates = function() {
			var get_template = function(jq_query) {
				var template_html = $(jq_query).html();
				var template = Handlebars.compile(template_html);

				return template;
			};

			this.templates = {
				dashboard: get_template("script#dashboard_template")
				, sidebar_team: get_template("script#sidebar_team_template")
				, dashboard_team: get_template("script#dashboard_team_template")
			};
		};

		this.db_do = function() {
			return this.dashboard_tag.dashboard.apply(this.dashboard_tag, arguments);
		};

		this.set_user = function(user) {
			this.user = user;
			this.db_do("set_username", user.username);
		};
		this.set_teams = function(teams) {
			this.teams = teams;
			this.db_do("set_teams", teams);
		};
		this.get_team_by_id = function(id) {
			for(var i = 0, len = this.teams.length; i < len; i++) {
				if(this.teams[i].id === id) return this.teams[i];
			}
			return null;
		};
	}).call(BrawlIO);
});
