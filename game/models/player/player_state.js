define(function(require) {
	var MovingObjectState = require("game/models/moving_object/moving_object_state");
	var oo_utils = require("game/util/object_oriented");

	var PlayerState = function(options) {
		PlayerState.superclass.call(this, options);
		this.health = options.health;
	};
	oo_utils.extend(PlayerState, MovingObjectState);

	(function(my) {
		var proto = my.prototype;
		proto.get_health = function() {
			return this.health;
		};
	})(PlayerState);

	return function(options) { return new PlayerState(options); };
});
