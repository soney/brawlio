define(function(require) {
	require("vendor/jquery");
	require("vendor/jquery-ui");
	var create_brawl = require("game/brawl");

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
				if(self.current_brawl!==undefined) {
					self.current_brawl.terminate();
				}
				self.test();
			});
//			self.test();
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
				var brawl = create_brawl({
					teams: [ {
							name: "Me"
							, players: [{
								code: team.code
							}]
						} , {
							name: "Opponent"
							, players: [{
								code: ""
							}]
						}
					]
					, map: {
						width: 50
						, height: 50
					}
					, round_limit: 20
				});
				brawl.run(function(winner) {
					if(winner === 0) {
						//BrawlIO.claim_crown();
					}
				});
				self.current_brawl = brawl;

/*
				var replay = brawl.get_replay();
				brawl.run(function(winner) {
					if(winner === 0) {
						BrawlIO.claim_crown();
					}
				});
				self.show_replay(replay);
				*/
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
