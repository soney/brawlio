(function(BrawlIO) {
	var _ = BrawlIO._;
	var BrawlDialog = {
		options: {
			my_code: ""
			, opponent_code: ""
			, game_log: undefined
			, title: "Brawl"
			, on_game_over: function(event) {}
			, debug: false
		}

		, _create: function() {
			var self = this;
			var game_log = this.option("game_log");

			if(game_log === undefined) {
				var bots = this.option("bots");
				var brawl = BrawlIO.create("brawl", {
					teams: [ {
							name: "Me"
							, players: [{
								code: this.option("my_code")
							}]
							, colors: ["yellow"]
							, win_text: "You win!"
						} , {
							name: "Opponent"
							, players: [{
								code: this.option("opponent_code")
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
					, debug_mode: this.option("debug")
				});
				this.brawl = brawl;

				var on_game_over = this.option("on_game_over");
				this.brawl.run(function(winner) {
					on_game_over({
						type: "game_over"
						, winner: winner
						, brawl: self.brawl
					});
				});

				game_log = this.brawl.get_game_log();
			}

			this.replay_element = $("<div />").replay_viewer({
				game_log: game_log
				, debug: this.option("debug")
			});
			this.replay_element.dialog({
				modal: true
				, resizable: false
				, draggable: true
				, title: this.option("title")
				, width: this.replay_element.replay_viewer("get_width") + 40
				, height: this.replay_element.replay_viewer("get_height") + 60
				, beforeClose: function() {
					_.defer(function() {
						self.destroy();
					});
					return false;
				}
			});
		}

		, destroy: function() {
			if(this.hasOwnProperty("brawl")) {
				this.brawl.terminate();
			}
			this.replay_element.replay_viewer("destroy");
			this.replay_element.dialog("destroy")
								.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.brawl_dialog", BrawlDialog);
}(BrawlIO));
