define(function() {
	require(["client/widgets/dashboard"]);

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
			this.dashboard_tag = dashboard_tag;
			this.dashboard_tag.dashboard();

			this.initialize_socket(key);
		};
		this.db_do = function() {
			return this.dashboard_tag.dashboard.apply(this.dashboard_tag, arguments);
		};
	}).call(BrawlIO);
});
