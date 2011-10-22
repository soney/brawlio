define(["game/brawl", "game/models/map", "game/models/team", "vendor/jquery", "vendor/jquery-ui"], function(Brawl, Map, Team) {
	var TeamTester = {
		options: {
			team_id: null
		}

		, _create: function() {
			var element = this.element
				, options = this.options
				, team_id = options.team_id
				, team = BrawlIO.get_team_by_id(team_id);

			var self = this;
			$("a#king_challenge").bind("click.show_dummy_replay", function() {
				$("a.save").click();
				self.test();
			});
			self.test();
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, test: function() {
			var self = this
				, options = this.options
				, team = BrawlIO.get_team_by_id(options.team_id);


			BrawlIO.get_king_code(function(king_code) {
				var map = new Map();
				var my_team = new Team({
					code: team.code
				});

				var other_team = new Team({
					code: ""//king_code 
				});

				var brawl = new Brawl({
					teams: [my_team, other_team]
					, map: map
					, round_limit: 40
				});
				var replay = brawl.get_replay();
				brawl.run(function(winner) {
					if(winner === 0) {
						BrawlIO.claim_crown();
					}
				});
				self.show_replay(replay);
			});
		}

		, show_replay: function(replay) {
			var element = this.element
				, replay_element = $(".replay", element);

			if(replay_element.data("replay_viewer")) {
				replay_element.replay_viewer("destroy");
			}
			replay_element.replay_viewer({
				replay: replay
			});
		}
	};

	$.widget("brawlio.team_tester", TeamTester);
});
