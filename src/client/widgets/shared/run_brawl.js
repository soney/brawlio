(function(BrawlIO) {
	var _ = BrawlIO._;
	var BrawlDialog = {
		options: {
			my_code: ""
			, opponent_code: ""
			, title: "Brawl"
			, debug: false
		}

		, _create: function() {
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

			var self = this;
			this.brawl.run(function(winner) {
				self.element.trigger({
					type: "game_over"
					, winner: winner
				});
			});

			var game_log = this.brawl.get_game_log();

			this.replay_element = $("<div />").replay_viewer({
				game_log: game_log
				, debug: this.option("debug")
			});
			this.replay_element.dialog({
				modal: true
				, resizable: false
				, draggable: false
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
			this.brawl.terminate();
			this.replay_element.replay_viewer("destroy");
			this.replay_element.dialog("destroy")
								.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.brawl_dialog", BrawlDialog);
}(BrawlIO));
