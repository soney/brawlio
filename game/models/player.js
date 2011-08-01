define(function(require, exports, module) {

	var PlayerModel = function(options) {
		if(options == null) {
			options = {};
		}
		this.attributes = {
			radius: 2 //Radius in tiles
			, movement_speed: 5.0 //Tiles per round
			, rotation_speed: 90*Math.PI/180.0 //Radians per round
			, max_health: 10 //Maximum health
			, index: -1
		};
	};

	return PlayerModel;
});
