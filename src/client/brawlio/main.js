(function(BrawlIO) {
	BrawlIO.assert = function(test, message) {
		if(BrawlIO._debug) {
			console.assert(test, message);
		}
	};

	(function() {
		this.initialize = function(key, dashboard_tag) {
			this.dashboard_tag = dashboard_tag;

			this.initialize_socket(key, function() {
				dashboard_tag.dashboard();
			});
		};

		this.set_user = function(user) {
			this.user = user;
		};

		this.set_bots = function(bots) {
			this.bots = bots;
		};

		this.get_user_by_id = function(id) {
			if(id != null) {
			} else {
				return this.user;
			}
		};

		this.get_team_by_id = function(id) {
			for(var i = 0, len = this.teams.length; i < len; i++) {
				if(this.teams[i].id === id) return this.teams[i];
			}
			return null;
		};
		var event_listeners = [];
		var event_listener_id = 0;
		this.on = this.add_event_listener = function(type, callback) {
			var id = event_listener_id;
			var event_listener = {
				type: type
				, callback: callback
				, id: id
			}
			event_listeners.push(event_listener);
			event_listener_id++;
			return id;
		};
		this.remove_event_listener = function(id) {
			for(var i = 0; i<event_listeners.length; i++) {
				var event_listener = event_listeners[i];
				if(id === event_listener.id || id === event_listener.callback) {
					event_listeners.splice(i, 1);
					i--;
				}
			}
		};
		this.emit = function(event) {
			for(var i = 0, len = event_listeners.length; i<len; i++) {
				var event_listener = event_listeners[i];
				if(event_listener.type === event.type) {
					event_listener.callback(event);
				}
			}
		};

		this.classes = [
			{name: "Grandmaster", min: 2400}
			, {name: "Master", min: 2200, max: 2399}
			, {name: "Candidate Master", min: 2000, max: 2199}
			, {name: "Class A", min: 1800, max: 1999}
			, {name: "Class B", min: 1600, max: 1799}
			, {name: "Class C", min: 1400, max: 1599}
			, {name: "Class D", min: 1200, max: 1399}
			, {name: "Class E", min: 1000, max: 1199}
			, {name: "Class F", min: 800,  max: 999}
			, {name: "Class G", min: 600,  max: 799}
			, {name: "Class H", min: 400,  max: 599}
			, {name: "Class I", min: 200,  max: 399}
			, {name: "Class J", max: 199}
			, {name: "Unranked"}
		];

		this.get_class_name = function(rating) {
			for(var i = 0; i<this.classes.length; i++) {
				var class_info = this.classes[i];
				if((class_info.min !== undefined || rating >= class_info.min) &&
					(class_info.max === undefined || rating <= class_info.max)) {
					return class_info.name;
				}
			}

			return undefined;
		};

		this.get_class_names = function() {
			var rv = new Array(this.classes.length);
			for(var i = 0; i<this.classes.length; i++) {
				rv[i] = this.classes[i].name;
			}
			return rv;
		};
		this.get_range_for_class = function(class_name) {
			for(var i = 0; i<this.classes.length; i++) {
				var class_info = this.classes[i];
				if(class_info.name === class_name) {
					return {min: class_info.min, max: class_info.max};
				}
			}
			return undefined;
		};
	}).call(BrawlIO);
}(BrawlIO));
