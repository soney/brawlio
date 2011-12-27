(function(BrawlIO) {
	var _ = BrawlIO._;
	BrawlIO.assert = function(test, message) {
		if(BrawlIO._debug) {
			console.assert(test, message);
		}
	};

	(function() {
		this.initialize = function(dashboard_tag) {
			this.dashboard_tag = dashboard_tag;
			this.brawls = [];

			this.initialize_socket(function() {
				dashboard_tag.dashboard();
			});
		};

		this.set_user = function(user) {
			this.user = user;
		};

		this.set_bots = function(bots) {
			this.bots = bots;
		};

		this.add_brawl = function(brawl) {
			if(!this.has_brawl_with_id(brawl.id)) {
				this.brawls.push(brawl);
				this.dashboard_tag.dashboard("brawl_added", brawl);
			}
		};

		var brawl_involves_bot = function(brawl, bot_id) {
			return brawl.bot1_fk === bot_id || brawl.bot2_fk === bot_id;
		};

		this.get_brawls_for_bot_id = function(bot_id) {
			return _(this.brawls)	.chain()
									.filter(function(brawl) {
										return brawl_involves_bot(brawl, bot_id);
									})
									.sortBy(function(brawl) {
										return -brawl.date;
									})
									.value()
									;
		};

		this.brawl_with_id = function(brawl_id) {
			var i = 0, len = this.brawls.length;
			for(i=0; i<len; i++) {
				var brawl = this.brawls[i];
				if(brawl.id === brawl_id) { return brawl; }
			}
			return null;
		};
		this.has_brawl_with_id = function(id) {
			return this.brawl_with_id(id) !== null;
		};

		this.get_user_by_id = function(id) {
			if(id != null) {
			} else {
				return this.user;
			}
		};

		this.get_bot_by_id = function(id) {
			for(var i = 0, len = this.bots.length; i < len; i++) {
				if(this.bots[i].id === id) { return this.bots[i]; }
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
			, {name: "Unrated"}
		];

		this.get_class_name = function(rating) {
			for(var i = 0; i<this.classes.length; i++) {
				var class_info = this.classes[i];
				if((class_info.min === undefined || rating >= class_info.min) &&
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
		this.pluralize = function(num, str, pluralized) {
			if(num === 1) {
				return num + " " + str;
			} else {
				if(pluralized === undefined) {
					pluralized = str + "s";
				}
				return num + " " + pluralized;
			}
		};
		this.get_record_str = function(bot) {
			var p = BrawlIO.pluralize;
			var record_text = p(bot.wins, "win") + ", " + p(bot.losses, "loss", "losses") + ", " + p(bot.draws, "tie");
			return record_text;
		};
		this.get_rating_str = function(bot) {
			var rating_text;
			if(bot.rated === false ) {
				rating_text = "Unrated";
			} else {
				rating_text = bot.rating + " (" + BrawlIO.get_class_name(bot.rating) + ")";
			}
			return rating_text;
		};
	}).call(BrawlIO);
}(BrawlIO));
