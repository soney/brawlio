define(function(require, exports, module) {
	var Constants = require("../constants");
	var PlayerModel = require("./player");

	var Team = function(options) {
		this.code = options.code;
		this.player_models = new Array(Constants.TEAM_SIZE);
		for(var i = 0; i<Constants.TEAM_SIZE; i++) {
			var player_model = new PlayerModel({
				number: i+1
			});
			this.player_models[i] = player_model;
		}
	};

	return Team;
});
