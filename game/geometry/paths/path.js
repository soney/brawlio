define(function(require) {
	var Path = function(options) {
		this.type = options.type;
	};
	(function(my) {
		var proto = my.prototype;
		proto.is = function(type) {
			return this.type === type;
		};
	}(Path));
	return Path;
});
