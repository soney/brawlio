define(function() {
	var TeamBrawl = {
		options: {
			team_id: null
		}

		, _create: function() {
			this.update_recommended_opponents();
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
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
});
