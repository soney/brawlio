define(function() {
	require(["vendor/underscore"]);

	var Map = function(options) {
		this.attributes = _.extend({
			width: 50 //Width in tiles
			, height: 50 //Height in tiles
			, start_positions: [
				[{x: 10, y: 10, theta: 0}]
				, [{x: 40, y: 40, theta: 0}]
			]
		}, options);
	};

	return Map;
});
