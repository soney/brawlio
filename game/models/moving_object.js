define([], function() {
	var MovingObject = function(options) {
		this.shape = options.shape;
		this.memorized_states = [];

		this.push_state(options.start_state, 0);
	};

	(function(my) {
		var proto = my.prototype;
		proto.intersectsWith = function() {
		};
		proto.get_relevant_memorized_state = function(time) {
			for(var i = 0, len = this.memorized_states.length; i<len; i++) {
				var memorized_state = this.memorized_states[i];
				if(time >= memorized_state.start_time_offset &&
						(memorized_state.end_time_offset === undefined || 
							time < memorized_state.end_time_offset)) {
					return memorized_state;
				}
			}
			return undefined;
		};
		proto.get_position = function(time) {
			var memorized_state = this.get_relevant_memorized_state(time);
			if(memorized_state !== undefined) {
				var delta_t = time - memorized_state.start_time_offset;
				var state = memorized_state.state;

				return state.get_position(delta_t);
			}
			return undefined;
		};
		proto.push_state = function(state, time_offset) {
			this.current_state = state;
			if(this.memorized_states.length > 0) {
				var last_memorized_state = this.memorized_states[this.memorized_states.length - 1];
				last_memorized_state.end_time_offset = time_offset;
			}

			var memorized_state = {
				state: state,
				start_time_offset: time_offset,
				end_time_offset: undefined
			};
			this.memorized_states.push(memorized_state);
		};
		proto.get_shape = function() {
			return this.shape;
		};
	})(MovingObject);


	return MovingObject;
});
