define(["vendor/jquery", "vendor/jquery-ui", "client/widgets/team/team_brawl", "client/widgets/team/team_editor", "client/widgets/team/team_tester"], function() {
	var Tab = {
		edit: 1
		, brawls: 2
	};
	var DashboardTeam = {
		options: {
			team_id: undefined
		}

		, _create: function() {
			var element = this.element,
				options = this.options,
				team = BrawlIO.get_team_by_id(options.team_id);

			var weight_class_name = team.weight_class_name;


			this.content = $(BrawlIO.templates.dashboard_team({code: team.code, weight_class_name: weight_class_name}));
			this.content.appendTo(element)
						.tabs();

			$("#brawls", this.content).team_brawl({team_id: options.team_id});
			$("#edit", this.content).team_editor({team_id: options.team_id});
			$("#test", this.content).team_tester({team_id: options.team_id});
		}

		, destroy: function() {
			this.content.tabs("destroy");
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.dashboard_team", DashboardTeam);
});
