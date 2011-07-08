define(function() {
	var BrawlIO = window.BrawlIO = {
		_debug: true
	};

	BrawlIO.assert = function(test, message) {
		if(BrawlIO._debug) {
			console.assert(test, message);
		}
	};

	(function() {
		this.initialize = function(key, dashboard) {
			this.dashboard = dashboard;
			this.initialize_socket(key);
		};
	}).call(BrawlIO);
});
