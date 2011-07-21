define(["game/brawl", "game/models/map", "game/models/team", "vendor/jquery", "vendor/jquery-ui"], function(Brawl, Map, Team) {
	var TeamEditor = {
		options: {
			team_id: null
		}

		, _create: function() {
			var element = this.element
				, options = this.options
				, team_id = options.team_id
				, team = BrawlIO.get_team_by_id(team_id);

			var content = $(BrawlIO.templates.team_editor({code: team.code}));
			element.append(content);

			var self = this;
			$("a.save", content).click(function() {
				self.save();
			});
			$("a.test", content).click(function() {
				self.test();
			});
			var check_length = function() {
				self.check_length(team);
			};
			$("textarea", content).keyup(check_length);
			this.check_length_interval = window.setInterval(check_length, 9000);
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
			this.check_length_interval = window.clearInterval(this.check_length_interval);
		}

		, check_length: function(team) {
			var code = this.get_code();
			var num_chars = code.length;
			if(num_chars > team.char_limit) {
				this.add_char_limit_warning(team, num_chars);
			}
			else {
				this.remove_char_limit_warning();
			}
		}

		, add_char_limit_warning: function(team, num_chars) {
			$("textarea", this.content).addClass("warning");
		}

		, remove_char_limit_warning: function() {
			$("textarea", this.content).removeClass("warning");
		}

		, test: function() {
			var self = this;

			this.save();

			var map = new Map();
			var my_team = new Team({
				code: self.get_code()
			});
			
			var other_team = new Team({
				code: ""
			});

			var brawl = new Brawl({
				teams: [my_team, other_team]
				, map: map
				, round_limit: 100
			});
			var replay = brawl.get_replay();
			brawl.run();
			this.show_replay(replay);
		}

		, show_replay: function(replay) {
			var element = this.element
				, sidebar = $(".sidebar", element);
			sidebar.html(BrawlIO.templates.replay);
			var replay_element = $(".replay", sidebar);

			replay_element.replay_viewer({
				replay: replay
			});
		}

		, save: function() {
			var team_id = this.options.team_id;

			var code = this.get_code();
			BrawlIO.set_team_code(team_id, code);
		}

		, get_code: function() {
			return $("textarea#code", this.element).val();
		}
	};

	$.widget("brawlio.team_editor", TeamEditor);
});
