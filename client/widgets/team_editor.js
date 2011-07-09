define(["vendor/jquery", "vendor/jquery-ui"], function() {
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
		}

		, destroy: function() {
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, save: function() {
			var element = this.element,
				team_id = this.options.team_id;

			var code = $("textarea#code", element).val();
			BrawlIO.set_team_code(team_id, code);
		}

	};

	$.widget("brawlio.team_editor", TeamEditor);
});
