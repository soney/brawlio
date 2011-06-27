(function(FistiCode) {
	var fc = FistiCode;

	if(fc._debug) {
		var point_id = 0;
	}
	var Point = function(x,y) {
		this.x = x;
		this.y = y;

		if(fc._debug) {
			this.type = "Point";
			this.id = point_id++;
		}
	};
	Point.prototype.clone = function() {
		return new Point(this.x, this.y);
	};
	Point.prototype.setX = function(x) {
		this.x = x;
	};
	Point.prototype.setY = function(y) {
		this.y = y;
	};
	Point.prototype.set = function(x,y) {
		if(x instanceof Point) {
			this.x = x.x;
			this.y = x.y;
		}
		else {
			this.x = x;
			this.y = y;
		}
	};
	Point.prototype.add = function(dx, dy) {
		this.x += dx;
		this.y += dy;
	};

	fc._create_point = function(x,y) {
		return new Point(x,y);
	};

	var QuickDict = function() {
		this.keys = [];
		this.values = [];
	};

	QuickDict.prototype.get_key_index = function(key) {
		for(var i = 0, len = this.keys.length; i < len; i++) {
			if(this.keys[i] == key) return i;
		}
		return -1;
	};

	QuickDict.prototype.get = function(key) {
		var key_index = this.get_key_index(key);
		if(key_index >= 0) {
			var value = this.values[key_index];
			return value;
		}
		else return undefined;
	};

	QuickDict.prototype.set = function(key, value) {
		var key_index = this.get_key_index(key);

		if(key_index >= 0) {
			this.values[key_index] = value;
		}
		else {
			this.keys.push(key);
			this.values.push(value);
		}
		
		return value;
	};

	QuickDict.prototype.get_length = function() {
		return this.keys.length;
	};

	fc._create_quick_dict = function() {
		return new QuickDict();
	};

	var LinkedList = function() {
		this.first = null;
		this.last = null;
		this.size = 0;
	};
	LinkedList.prototype.push = function(data) {
		var ll_item = new LinkedListItem(data); 
		if(this.first === null) {
			this.first = ll_item;
		}

		if(this.last !== null) {
			this.last.next = ll_item;
			ll_item.prev = this.last;
		}

		this.last = ll_item;
		this.size++;
	};

	LinkedList.prototype.forEach = function(on_each) {
		var curr_node = this.first;
		var length = this.get_length();
		for(var i = 0; i<length; i++) {
			on_each(curr_node.data, i);
			curr_node = curr_node.next;
		}
	};
	LinkedList.prototype.get_length = function() {
		return this.size;
	};
	LinkedList.prototype.toArray = function() {
		var arr = [];
		arr.length = this.get_length();
		this.forEach(function(item, index) {
			arr[index] = item;
		});
		return arr;
	};
	LinkedList.prototype.item = function(index, to_value) {
		var curr_index = 0;
		var curr_node = this.first;
		while(curr_index < index) {

			if(curr_node.next === null) {
				if(arguments.length === 1) {
					return undefined;
				}
				else {
					this.push(undefined);
				}
			}

			curr_node = curr_node.next;
			curr_index += 1;
		};

		if(arguments.length === 1) {
			return curr_node.data;
		}
		else {
			return curr_node.data = to_value;
		}
	};

	var LinkedListItem = function(data) {
		this.data = data;
		this.next = null;
		this.prev = null;
	};

	fc._create_linked_list = function() {
		return new LinkedList();
	};

	var GameTimer = function(game) {
		this.game = game;
		this.timers = {};
	};
	GameTimer.prototype.reset = function(timer_name) {
		var new_value = this.game.get_round();
		if(_.isUndefined(this.timers[timer_name])) {
			this.timers[timer_name] = new_value;
		}
		var old_value = this.timers[timer_name];

		this.timers[timer_name] = new_value;

		return new_value - old_value;
	};
	fc._create_timer = function(game) {
		return new GameTimer(game);
	};
})(FistiCode);
