(function(FistiCode, jQuery) {
	var fc = FistiCode;
	var $ = jQuery;

	fc._action_types = {
		MOVE: 1,
		ROTATE: 2,
		FIRE: 3
	};

	fc._movement_types = {
		NONE: 10,
		FORWARD: 11,
		BACKWARD: 12,
		LEFT: 13,
		RIGHT: 14
	};

	fc._rotation_types = {
		NONE: 20,
		CLOCKWISE: 21,
		COUNTERCLOCKWISE: 22
	};

	fc._fire_types = {
		NONE: 30,
	};

	var Action = function(type, subtype, options) {
		this.type = type;
		this.subtype = subtype;
		this.options = options;
	};

	Action.prototype.is_type = function(type) {
		return type === this.type;
	};

	fc._create_action = function(type, subtype, options) {
		return new Action(type, subtype, options);
	};
})(FistiCode, jQuery);
