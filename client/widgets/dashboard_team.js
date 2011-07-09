define(["vendor/jquery", "vendor/jquery-ui", "vendor/handlebars"], function() {
	var DashboardTeam = {
		options: {
			team: null,
			template: null
		}

		, _create: function() {
			this._initialize_templates();

			var element = this.element,
				options = this.options,
				team = options.team,
				template = options.template;

			element.text(team.weight_class_name);
		}

		, _initialize_templates: function() {
			var get_template = function(jq_query) {
				var template_html = $(jq_query).html();
				var template = Handlebars.compile(template_html);

				return template;
			};

			this.dashboard_template = get_template("script#dashboard_template");
			this.sidebar_team_template = get_template("script#sidebar_team_template");
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.dashboard_team", DashboardTeam);
});
