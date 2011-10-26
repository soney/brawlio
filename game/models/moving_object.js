define(['game/models/moving_object_state'], function(MovingObjectState) {
	var MovingObject = function(options) {
		this.shape = options.shape;
		this.memorized_movement_states = [];

		if(options.shart_state !== undefined) {
			this.push_state(options.start_state, 0);
		}
	};

	(function(my) {
		var proto = my.prototype;
		
		proto.intersectsWith = function() { };

		proto.get_relevant_memorized_state = function(time) {
			for(var i = 0, len = this.memorized_movement_states.length; i<len; i++) {
				var memorized_state = this.memorized_movement_states[i];
				if(memorized_state.valid_at(time)) {
					return memorized_state;
				}
			}
			return undefined;
		};

		proto.get_position = function(time) {
			var state = this.get_relevant_memorized_state(time);
			if(state !== undefined) {
				var delta_t = time - state.get_valid_from();
				return state.get_position(delta_t);
			}
			return undefined;
		};

		proto.push_state = function(state, time_offset) {
			this.movement_state = state;
			if(this.memorized_movement_states.length > 0) {
				var last_memorized_state = this.memorized_movement_states[this.memorized_movement_states.length - 1];
				last_memorized_state.set_valid_to(time_offset);
			}
			this.memorized_movement_states.push(state);
		};

		proto.get_movement_state = function() {
			return this.memorized_movement_states[this.memorized_movement_states.length-1];
		};

		proto.get_shape = function() {
			return this.shape;
		};
	})(MovingObject);

	return MovingObject;
});
