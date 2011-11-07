define(function(require) {
	var MovingObjectState = require("game/models/moving_object/moving_object_state");
	var oo_utils = require("game/util/object_oriented");

	var ProjectileState = function(options) {
		ProjectileState.superclass.call(this, options);
	};
	oo_utils.extend(ProjectileState, MovingObjectState);

	(function(my) {
		var proto = my.prototype;
	})(ProjectileState);

	return function(options) { return new ProjectileState(options); };
});
