define(function(require, exports, module) {
	var Map = function(options) {
		if(options == null) {
			options = {};
		}
		this.attributes = {
			width: 50 //Width in tiles
			, height: 50 //Height in tiles
			, start_positions: [
				[{x: 10, y: 10, theta: 0}]
				, [{x: 40, y: 40, theta: 0}]
			]
		};
	};

	return Map;
});
