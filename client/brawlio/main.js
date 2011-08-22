define(function(require, exports, module) {
	require(["vendor/handlebars"]);
	require(["client/widgets/dashboard"]);
	require(["client/widgets/replay_viewer"]);

	var BrawlIO = window.BrawlIO = {
		_debug: true
	};

	BrawlIO.assert = function(test, message) {
		if(BrawlIO._debug) {
			console.assert(test, message);
		}
	};

	(function() {
		this.initialize = function(key, dashboard_tag) {
			this.initialize_templates();
			this.dashboard_tag = dashboard_tag;

			this.initialize_socket(key, function() {
				dashboard_tag.dashboard();
			});
		};

		this.initialize_templates = function() {
			var get_template = function(jq_query) {
				var template_html = $(jq_query).html();
				var template = Handlebars.compile(template_html);

				return template;
			};

			this.templates = {
			/*
				dashboard: get_template("script#dashboard_template")
				, sidebar_team: get_template("script#sidebar_team_template")
				, dashboard_team: get_template("script#dashboard_team_template")
				, dashboard_me: get_template("script#dashboard_me_user_template")
				*/
			};
		};

		this.db_do = function() {
			return this.dashboard_tag.dashboard.apply(this.dashboard_tag, arguments);
		};

		this.set_user = function(user) {
			this.user = user;
			this.db_do("set_username", user.username);
		};
		this.set_teams = function(teams) {
			this.teams = teams;
			this.db_do("set_teams", teams);
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
	}).call(BrawlIO);
});
