(function(BrawlIO) {
	var StaticObstacle = function(options) {
		this.shape = options.shape;
	};

	(function(my) {
		var proto = my.prototype;
		//If will not touch, return false
		//Otherwise, return the delta t until it will touch
		proto.next_touch_event = function(moving_object, moving_object_state) {
			return false;
		};
		proto.is_touching = function(moving_object, position) {
			return false;
		};
		proto.restrict_path = function(moving_object, path) {
			return path;
		};
		proto.get_shape = function() {
			return this.shape;
		};
	}(StaticObstacle));

	BrawlIO.define_type("StaticObstacle", StaticObstacle);
}(BrawlIO));
