define(["vendor/jquery", "vendor/jquery-ui"], function() {
	var DashboardTeam = {
		options: {
		}

		, _create: function() {
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.dashboard_team", DashboardTeam);
});
