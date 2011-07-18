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
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
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
