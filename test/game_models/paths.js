
require(['game/models/moving_object', 'game/models/moving_object_state', 'game/models/shapes/circle'], function(MovingObject, MovingObjectState, Circle) {
	module("Paths");
	test("Basic Moving Object", function() {
		var going_right = new MovingObject({
			start_state: new MovingObjectState({
				start: {
					x: 0, y: 0, theta: 0
				}
			, translational_velocity: 10
			, rotational_velocity: 0
			})
		, shape: new Circle({radius: 10})
		});

		var position_equals = function(pos_1, pos_2) {
			var epsilon = 0.00000001
			ok(Math.abs(pos_1.x - pos_2.x) < epsilon &&
					Math.abs(pos_1.x - pos_2.x) < epsilon &&
						Math.abs(pos_1.x - pos_2.x) < epsilon);
		};

		position_equals(going_right.get_position(0), {
			x: 0, y: 0, theta: 0
		});
		position_equals(going_right.get_position(1), {
			x: 10, y: 0, theta: 0
		});
		position_equals(going_right.get_position(2), {
			x: 20, y: 0, theta: 0
		});

		var going_down = new MovingObject({
			start_state: new MovingObjectState({
				start: {
					x: 0, y: 0, theta: -Math.PI/2.0
				}
			, translational_velocity: 10
			, rotational_velocity: 0
			})
		, shape: new Circle({radius: 10})
		});

		position_equals(going_down.get_position(0), {
			x: 0, y: 0, theta: -Math.PI/2.0
		});
		position_equals(going_down.get_position(1), {
			x: 0, y: 10, theta: -Math.PI/2.0
		});
		position_equals(going_down.get_position(2), {
			x: 0, y: 20, theta: -Math.PI/2.0
		});
	});
});
