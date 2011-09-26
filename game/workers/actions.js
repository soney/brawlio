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
	, stop_firing: 21
	, sense: 22
};

try {
	if(typeof exports !== undefined) {
		exports.Actions = Actions;
	}
}
catch(e) {}
