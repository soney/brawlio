(function(BrawlIO) {
    var JavaScriptMode = require("ace/mode/javascript").Mode;

	var BotEdit = {
		options: {
			dashboard: undefined
			, bot: undefined
			, save_period: 5000
		}

		, _create: function() {
			var self = this;
			this.saving = false;
			this.changed = false;
			var bot = this.option("bot");
			this.save_row = $("<div />").appendTo(this.element)
										.addClass("toolbar_row");
			this.save_button = $("<a />")	.text("Saved")
											.addClass("save small button")
											.attr("href", "javascript:void(0)")
											.on("click.save", $.proxy(this.save, this))
											.appendTo(this.save_row);

			this.ace_editor = $("<div />").css({
				height: "400px"
				, position: "relative"
				, border: "1px solid #AAA"
			}).appendTo(this.element);

			this.editor = ace.edit(this.ace_editor[0]);
			var session = this.editor.getSession();
			session.on("change", function(event) {
				self.on_code_changed();
			});

			session.setValue(bot.code);
			session.setMode(new JavaScriptMode());
			this.editor.renderer.setHScrollBarAlwaysVisible(false);

			this.save_interval = window.setInterval($.proxy(this.save_if_changed, this), this.option("save_period"));
			$(window).on("unload.bot_edit", $.proxy(this.save, this));
		}

		, destroy: function() {
			$(window).off("unload.bot_edit");
			this.save_row.remove();
			this.save();
			this.editor.destroy();
			window.clearInterval(this.save_interval);
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, save: function() {
			this.on_start_save();
			var bot = this.option("bot");
			var code = this.get_code();
			BrawlIO.set_bot_code(bot.id, code, $.proxy(this.on_finish_save, this));
		}

		, get_code: function() {
			return this.editor.getSession().getValue();
		}

		, on_start_save: function() {
			this.save_button.text("Saving...").addClass("disabled");
			this.saving = true;
		}
		, on_finish_save: function() { 
			this.save_button.text("Saved").addClass("disabled");
			this.saving = false;
			this.changed = false;
		}
		, on_code_changed: function() {
			this.save_button.text("Save").removeClass("disabled");
			this.changed = true;
		}
		, saved_clicked: function() {
			if(this.saving) {
				return;
			} else {
				this.save();
			}
		}
		, save_if_changed: function() {
			if(this.changed) {
				this.save();
			}
		}
	};

	$.widget("brawlio.bot_edit", BotEdit);
}(BrawlIO));
