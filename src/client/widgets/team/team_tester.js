(function(BrawlIO) {
	var TeamTester = {
		options: {
			team_id: null
			, debug: true
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
					self.current_brawl = undefined;
				}
				self.test();
			});
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, test: function() {
			var self = this
				, options = this.options
				, team = BrawlIO.get_team_by_id(options.team_id);
			var code = team.code;
			BrawlIO.get_king_code(function(king_code) {
				var brawl = BrawlIO.create("brawl", {
					teams: [ {
							name: "Me"
							, players: [{
								code: code
							}]
							, colors: ["yellow"]
							, win_text: "You win!"
						} , {
							name: "Opponent"
							, players: [{
								code: king_code
							}]
							, colors: ["#777"]
							, win_text: "You lose"
						}
					]
					, map: {
						width: 50
						, height: 50
					}
					, round_limit: 40
					, debug_mode: self.option("debug")
				});
				self.current_brawl = brawl;

				var replay = brawl.get_replay();
				brawl.run();
				var replay_element = self.show_replay(replay);
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
				, debug: this.option("debug")
			});
			return replay_element;
		}
	};

	$.widget("brawlio.team_tester", TeamTester);
}(BrawlIO));
