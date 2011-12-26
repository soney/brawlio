(function(BrawlIO) {
	var _ = BrawlIO._;
	var GameLog = function(options) {
		this.complete = options.complete || false;
		this.game_events = options.game_events || [];
		this.game_states = options.game_states || [];
		this.last_round = options.last_round || 0;
		this.map = options.map;
		this.round_limit = options.round_limit;
		this.teams = options.teams;
		BrawlIO.make_listenable(this);
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_map = function() { return this.map; };
		proto.add_moving_object = function(object, appears_at, disappears_at) {
			var meta_obj = {
				object: object,
				appears_at: appears_at,
				disappears_at: disappears_at
			};
			this.objects.push(meta_obj);
		};
		proto.is_complete = function() { return this.complete;};
		proto.get_snapshot_at = function(round) {
			var moving_object_states = this.get_moving_object_states(round);
			var map = this.get_map();
			return {
				round: round
				, moving_object_states: moving_object_states
				, map: {
					width: map.get_width()
					, height: map.get_height()
				}
			};
		};
		proto.get_game_events_between = function(from_round, to_round) {
			return _.filter(this.game_events, function(game_event) {
				var round = game_event.get_round();
				return round >= from_round && round < to_round;
			});
		};
		proto.push_game_event = function(game_event) {
			this.game_events.push(game_event);
		};

		proto.push_game_state = function(game_state) {
			this.game_states.push(game_state);
		};

		proto.get_last_round = function() {
			return this.last_round;
		};
		proto.set_winner = function(winner) {
			this.winner = winner;
		};
		proto.get_winner = function() {
			return this.winner;
		};
		proto.get_round_limit = function() {
			return this.round_limit;
		};
		proto.get_max_rounds = function() {
			if(this.is_complete()) {
				return this.get_last_round();
			} else {
				return this.get_round_limit();
			}
		};
		proto.mark_complete = function(winner) {
			this.complete = true;
			this.set_winner(winner);
			this.emit({
				type: "complete"
			});
		};
		proto.set_last_round = function(round) {
			this.last_round = round;
			this.emit({
				type: "last_round_changed"
				, last_round: this.last_round
			});
		};
		proto.get_relevant_state = function(round) {
			var i;
			for(i = this.game_states.length-1; i>=0; i--) {
				var state = this.game_states[i];
				if(state.is_relevant_to_round(round)) {
					return state;
				}
			}
			return undefined;
		};
		proto.get_moving_object_states = function(round) {
			var relevant_state = this.get_relevant_state(round);
			if(relevant_state === undefined) {
				return undefined;
			}
			var include_paths = true;
			return relevant_state.get_moving_object_states(round, include_paths);
		};
		proto.peek_state = function() {
			return _.last(this.game_states);
		};
		proto.serialize = proto.toJSON = function() {
			var serialized_moving_objects = {};
			var serialized_map = this.get_map().serialize();
			var serialized_game_events = _.map(this.game_events, function(x) {
				return x.serialize();
			});
			var serialized_game_states = _.map(this.game_states, function(x) {
				var moving_objects = x.get_moving_objects();
				_.forEach(moving_objects, function(moving_object) {
					if(!moving_object.is("player")) {
						var id = moving_object.get_id();
						if(!serialized_moving_objects.hasOwnProperty(id)) {
							serialized_moving_objects[id] = moving_object.serialize();
						}
					}
				});
				return x.serialize();
			});
			return {
				map: serialized_map
				, teams: _.map(this.teams, function(team) {
					return team.serialize()
				})
				, game_events: serialized_game_events
				, game_states: serialized_game_states
				, complete: this.is_complete()
				, last_round: this.get_last_round()
				, round_limit: this.get_round_limit()
				, version: BrawlIO.game_constants.REPLAY_VERSION
				, moving_objects: serialized_moving_objects
			};
		};
		proto.stringify = function() {
			var serialized = this.serialize();
			var rv = JSON.stringify(serialized);
			return rv;
		};

		my.deserialize = function(obj) {
			var map = BrawlIO.create("deserialized_map", obj.map);
			var complete = obj.complete;
			var last_round = obj.last_round;
			var round_limit = obj.round_limit;
			var moving_object_map = {};


			var teams = _.map(obj.teams, function(serialized_team) {
				return BrawlIO.create("deserialized_team", serialized_team);
			});
			_.forEach(teams, function(team) {
				var players = team.get_players();
				_.forEach(players, function(player) {
					moving_object_map[player.id] = player;
				});
			});

			var projectile_moving_objects = _.filter(obj.moving_objects, function(serialized_moving_object, id) {
				return serialized_moving_object.type === "projectile";
			});

			_.forEach(projectile_moving_objects, function(serialized_moving_object) {
				var id = serialized_moving_object.id;
				var moving_object = BrawlIO.create("deserialized_projectile", serialized_moving_object, moving_object_map)
				moving_object_map[id] = moving_object;
			});

			var game_events = _.map(obj.game_events, function(serialized_game_event) {
				var game_event = BrawlIO.create("deserialized_game_event", serialized_game_event, moving_object_map);
				return game_event;
			});

			var game_states = _.map(obj.game_states, function(serialized_game_state) {
				var game_state = BrawlIO.create("deserialized_game_state", serialized_game_state, moving_object_map);
				return game_state;
			});

			return BrawlIO.create("game_log", {
				complete: complete
				, last_round: last_round
				, round_limit: round_limit
				, game_events: game_events
				, game_states: game_states
				, map: map
				, teams: teams
			});
		};
	}(GameLog));


	BrawlIO.define_factory("game_log", function(options) {
		return new GameLog(options);
	});

	BrawlIO.define_factory("game_log_from_string", function(str) {
		var game_log_obj = JSON.parse(str);
		return GameLog.deserialize(game_log_obj);
	});

}(BrawlIO));
