(function(BrawlIO) {
    var JavaScriptMode = require("ace/mode/javascript").Mode;

	var BotEdit = {
		options: {
			dashboard: undefined
			, bot: undefined
			, save_period: 3000
		}

		, _create: function() {
			var bot = this.option("bot");

			this.ace_editor = $("<div />").css({
				height: "400px"
				, position: "relative"
				, border: "1px solid #AAA"
			}).appendTo(this.element);

			this.editor = ace.edit(this.ace_editor[0]);
			var session = this.editor.getSession();

			session.setValue(bot.code);
			session.setMode(new JavaScriptMode());
			this.editor.renderer.setHScrollBarAlwaysVisible(false);

			this.save_interval = window.setInterval($.proxy(this.save, this), this.option("save_period"));
			$(window).on("unload.bot_edit", $.proxy(this.save, this));
		}

		, destroy: function() {
			$(window).off("unload.bot_edit");
			this.save();
			this.editor.destroy();
			window.clearInterval(this.save_interval);
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, save: function() {
			var bot = this.option("bot");

			var code = this.get_code();
			BrawlIO.set_bot_code(bot.id, code);
		}

		, get_code: function() {
			return this.editor.getSession().getValue();
		}

	};

	$.widget("brawlio.bot_edit", BotEdit);
}(BrawlIO));
