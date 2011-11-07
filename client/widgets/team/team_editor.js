define(["ace/ace", "ace/mode/javascript", "ace/theme/idle_fingers", "vendor/jquery", "vendor/jquery-ui"], function(ace) {
	//var JavaScriptMode = JSMode.Mode;
    var JavaScriptMode = require("ace/mode/javascript").Mode;
	var TeamEditor = {
		options: {
			team_id: null
		}

		, _create: function() {
			var element = this.element
				, options = this.options
				, team_id = options.team_id
				, team = BrawlIO.get_team_by_id(team_id);

			var self = this;
			$("a.save", element).click(function() {
				self.save();
			});
			var check_length = function() {
				self.check_length(team);
			};
			var editor = this.editor = ace.edit("ace_editor");
			var session = editor.getSession();

			editor.setTheme("ace/theme/idle_fingers");
			session.setValue(team.code);
			session.setMode(new JavaScriptMode());
			editor.renderer.setHScrollBarAlwaysVisible(false);
		}

		, destroy: function() {
			this.editor.destroy();
			this.element.html("");
			$.Widget.prototype.destroy.apply(this, arguments);
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

		, save: function() {
			var team_id = this.options.team_id;

			var code = this.get_code();
			BrawlIO.set_team_code(team_id, code);
		}

		, get_code: function() {
			return this.editor.getSession().getValue();
		}
	};

	$.widget("brawlio.team_editor", TeamEditor);
});
