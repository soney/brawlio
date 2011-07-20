var Actions = {
	move_type: 0
	, move: {
		stop: 00
		, forward: 01
		, backward: 02
		, left: 03
		, right: 04
	}

	, rotate_type: 1
	, rotate: {
		stop: 10
		, clockwise: 11
		, counter_clockwise: 12
	}

	, instantaneous_type: 2
	, fire: 20
	, sense: 21

	, get_type: function(action) {
		if(action >= 00 && action <= 09) {
			return Actions.move_type;
		}
		else if(action >= 10 && action <= 19) {
			return Actions.rotate_type;
		}
		else if(action >= 20 && action <= 29) {
			return Actions.instantaneous_type;
		}
	}
};
