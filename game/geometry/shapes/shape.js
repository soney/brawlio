define(function(require) {
	var Shape = function(options) {
		this.name = "none";
	};
	(function(my) {
		var proto = my.prototype;
		proto.get_name = function() {
			return this.name;
		};
		proto.is = function(name) {
			return this.name === name;
		};
	})(Shape);
	return Shape;
});
