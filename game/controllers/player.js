define(["game/models/player_model", "game/actions", "vendor/underscore"], function(PlayerModel, Actions) {
	var Player = function(options) {
		options = _.extend({
		}, options);

		var model = options.model;
		this._ask = function(action) {
			return model.ask(action);
		};
	};

	(function() {
		this.move_forward = function() {
			return this._ask(Actions.move.forward);
		};
		this.stop_moving = function() {
			return this._ask(Actions.move.stop);
		};
	}).call(Player.prototype);

	return Player;
});
