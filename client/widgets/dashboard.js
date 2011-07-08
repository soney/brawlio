define(["vendor/jquery", "vendor/jquery-ui"], function() {
	var Dashboard = {
		options: {
		}

		, _create: function() {
			console.log("it's a dashboard");
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.dashboard", Dashboard);
});
