define(["game/actions"], function(Actions) {
	require(["vendor/underscore"]);

	var PlayerModel = function(options) {
		options = _.extend({
			attributes: undefined
			, state: undefined
		}, options);

		this.attributes = _.extend({
			radius: 4 //Radius in tiles
			, movement_speed: 10.0 //Tiles per round
			, rotation_speed: 90*Math.PI/180.0 //Radians per round
			, max_health: 10 //Maximum health
			, index: -1
		}, options.attributes);
	};

	return PlayerModel;
});
