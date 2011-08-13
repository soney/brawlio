define(['game/replay/replay'], function(Replay) {
	var TeamBrawl = {
		options: {
			team_id: null
		}

		, _create: function() {
			this.update_recommended_opponents();

			var self = this;
			BrawlIO.get_brawls(function(brawls) {
				brawls.forEach(function(brawl) {
					self.add_brawl(brawl);
				});
			});
			this._new_brawl_listener = BrawlIO.on("brawl_done", function(event) {
				var brawl = event.brawl;
				self.add_brawl(brawl);
			});
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
			BrawlIO.remove_listener(this._new_brawl_listener);
		}

		, add_brawl: function(brawl) {
			var element = this.element;
			var team_id = this.option("team_id");
			var my_index = brawl.team_1_fk === team_id ? 1 : 2;

			var result;
			if(brawl.result === my_index) {
				result = "Win";
			}
			else if(brawl.result === 0) {
				result = "Draw";
			}
			else {
				result = "Lost";
			}

			var other_id = my_index === 1 ? brawl.user_2_fk : brawl.user_1_fk;

			var brawl_div = $("<div />").text("vs " + other_id+": "+result+" - ")
										.appendTo($(".brawl_history", element))
										;
			var replay_button = $("<a />")	.attr("href", "javascript:void(0)")
											.text("Replay")
											.appendTo(brawl_div)
											.click(function() {
												$.ajax({
													url: "replay/"+encodeURIComponent(brawl.replay_filename)
													, success: function(data) {
														var parsed_data = JSON.parse(data);
														var replay = new Replay(parsed_data);

														if(replay) {
															var replay_element = $(".replay", element);
															if(replay_element.data("replay_viewer")) {
																replay_element.replay_viewer("destroy");
															}
															replay_element.replay_viewer({
																replay: replay
															});
														}
													}
												});
											})
											;
		}

		, update_recommended_opponents: function() {
			var element = this.element
				, options = this.options
				, my_team_id = options.team_id;

			var possible_opponents = $(".possible_opponents", element);
			BrawlIO.choose_opponents_for_team(my_team_id, function(opponents) {
				var opposing_user_ids = opponents.map(function(opponent) {
					return opponent.user_fk;
				});

				var opposing_users = BrawlIO.get_users(opposing_user_ids, function(users) {
					$(".possible_opponent", possible_opponents)	.possible_opponent("destroy")
																.remove();

					users.forEach(function(user, user_index) {
						var opponent = opponents[user_index];
						$("<div />")	.addClass("possible_opponent")
										.appendTo(possible_opponents)
										.possible_opponent({
											user_id: user.id
											, team_id: opponent.id
											, user: user
											, team: opponent
											, my_team_id: my_team_id
											});
					});
				});
			});
		}
	};
	$.widget("brawlio.team_brawl", TeamBrawl);


	var PossibleOpponent = {
		options: {
			user_id: null
			, team_id: null
			, user: null
			, team: null
			, my_team_id: null
		}

		, _create: function() {
			var element = this.element
				, options = this.options
				, team_id = options.team_id
				, user_id = options.user_id
				, user = options.user
				, team = options.team
				, my_team_id = options.my_team_id;

			var fight_link = $("<a />")	.attr("href", "javascript:void(0)")
										.text("Brawl!")
										.click(function() {
											BrawlIO.request_formal_brawl(my_team_id, team_id);
										});

			element	.text(user.username + " ")
					.append(fight_link);
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

	};
	$.widget("brawlio.possible_opponent", PossibleOpponent);

	var Brawl = {
		options: {
			user_id: null
			, team_id: null
			, user: null
			, team: null
			, my_team_id: null
		}

		, _create: function() {
			var element = this.element
				, options = this.options
				, team_id = options.team_id
				, user_id = options.user_id
				, user = options.user
				, team = options.team
				, my_team_id = options.my_team_id;

			var fight_link = $("<a />")	.attr("href", "javascript:void(0)")
										.text("Brawl!")
										.click(function() {
											BrawlIO.request_formal_brawl(my_team_id, team_id);
										});

			element	.text(user.username + " ")
					.append(fight_link);
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

	};
	$.widget("brawlio.brawl", Brawl);
});
