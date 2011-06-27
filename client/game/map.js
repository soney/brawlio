(function(FistiCode, jQuery) {
	var fc = FistiCode;
	var $ = jQuery;

	var Map = function(attributes) {
		this.attributes = $.extend({
			width: 100,
			height: 100,
			starting_points: [
				[
					fc._create_point(10,10),
					fc._create_point(10, 20),
					fc._create_point(10, 30)
				],
				[
					fc._create_point(90,90),
					fc._create_point(90, 80),
					fc._create_point(90, 70)
				]
			]
		}, attributes);

		if(fc._debug) {
			this.type = "Map";
		}
	};
	Map.prototype.prevent_collision = function(old_point, radius) {
		var min_x = old_point.x - radius,
			max_x = old_point.x + radius,
			min_y = old_point.y - radius,
			max_y = old_point.y + radius;

		var new_x = null;
		if(min_x < 0) {
			new_x = radius;
		}
		if(max_x > this.attributes.width) {
			new_x = this.attributes.width - radius;
		}

		var new_y = null;
		if(min_y < 0) {
			new_y = radius;
		}
		if(max_y > this.attributes.height) {
			new_y = this.attributes.height - radius;
		}

		if(new_x === null && new_y === null) {
			return false;
		}
		else {
			if(new_x === null) new_x = old_point.x;
			if(new_y === null) new_y = old_point.y;

			return old_point.set(new_x, new_y);
		}
	};

	Map.prototype.collision_at = function(old_point, new_point, radius) {
		var dx = new_point.x - old_point.x,
			dy = new_point.y - old_point.y;

		var min_x = new_point.x - radius,
			max_x = new_point.x + radius,
			min_y = new_point.y - radius,
			max_y = new_point.y + radius;

		var x_collision_percentage = null;
		if(min_x < 0) {
			x_collision_percentage = new_point.x - dx;
		}
		if(max_x > this.attributes.width) {
			new_x = this.attributes.width - radius;
		}


	};

	fc._create_map = function(attributes) {
		var map = new Map(attributes);
		return map;
	};
})(FistiCode, jQuery);
