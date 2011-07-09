define(["vendor/jquery", "vendor/jquery-ui"], function() {
	require(["client/widgets/team_editor"]);

	var Tab = {
		edit: 1
		, brawls: 2
	};
	var DashboardTeam = {
		options: {
			team: null
		}

		, _create: function() {
			var element = this.element,
				options = this.options,
				team = options.team;

			var content = $(BrawlIO.templates.dashboard_team());
			element.html("");
			var self = this;
			element.append(content);

			$("a.brawls", content).click(function() {
				self.set_tab(Tab.brawls);
			});
			$("a.edit", content).click(function() {
				self.set_tab(Tab.edit);
			});
			this.set_tab(Tab.edit);
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, set_tab: function(tab) {
			var element = this.element,
				content = $(".content", element),
				options = this.options,
				team_id = options.team_id;

			if(content.data("team_editor")) {
				content.team_editor("destroy");
			}

			if(tab === Tab.edit) {
				content.team_editor({team_id: team_id});
			}
			else if(tab === Tab.brawls) {
				console.log("brawls");
			}
		}
	};

	$.widget("brawlio.dashboard_team", DashboardTeam);
});
