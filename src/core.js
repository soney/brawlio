var BrawlIO = (function() {
	var on_call = function() {
	};

	var BrawlIO = function() {
		return on_call.apply(this, arguments);
	};

	BrawlIO._debug = false;
	BrawlIO.get_time = function() {
		return (new Date()).getTime();
	};
	var tolerance = 0.00000001;
	BrawlIO.close_to = function(a, b) {
		return Math.abs(a-b) < tolerance;
	};

	BrawlIO.Types = {};
	BrawlIO.define_type = function(name, type) {
		BrawlIO.Types[name] = type;
	};
	BrawlIO.get_type = function(name) {
		return BrawlIO.Types[name];
	};

	BrawlIO.factories = {};
	BrawlIO.define_factory = function(name, factory) {
		BrawlIO.factories[name] = factory;
	};
	BrawlIO.create = function(name) {
		var i, len = arguments.length;
		var args = [];
		for(i = 1; i<len; i++) {
			args.push(arguments[i]);
		}

		var factory = BrawlIO.factories[name];
		return factory.apply(this, args);
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = BrawlIO;
    } else {
		window.BrawlIO = BrawlIO;
    }
	return BrawlIO;
}());
