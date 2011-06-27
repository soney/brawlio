(function(FistiCode, jQuery) {
	var fc = FistiCode;
	var $ = jQuery;

	var GameController = function(game) {
		this.game = game;

		if(fc._debug) {
			this.type = "GameController";
			fc.assert(this.game!=null);
		}
	};

	GameController.prototype.ask = function(action_type, player, options) {
		var game = this.game,
			action = fc._create_action(action_type, player, options);
		game.log_action(action);
		return action;
	};

	fc._create_game_controller = function(game) {
		var gc = new GameController(game);
		return gc;
	};
})(FistiCode, jQuery);
