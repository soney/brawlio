(function(BrawlIO) {
	var DashboardBot = {
		options: {
			dashboard: undefined
			, bot_id: undefined
		}

		, _create: function() {
			var self = this;
			var element = this.element;
			var dashboard = this.option("dashboard");
			var bot_id = this.option("bot_id");
			var bot = BrawlIO.get_bot_by_id(bot_id);

			this.botname_display = $("<div />")	.append(
													$("<a />")	.attr("href", "javascript:void(0)")
																.click(function() {
																	dashboard.render_home();
																})
																.text(BrawlIO.user.username)
												)
												.append("/")
												.append(
													$("<a />")	.attr("href", "javascript:void(0)")
																.click(function() {
																	dashboard.render_bot(bot);
																})
																.text(bot.name)
												)
												.addClass("username")
												.appendTo(element);
			this.tabs = $("<div />").appendTo(element);
			this.tab_content = $("<div />").appendTo(element);

			this.tabs.on("select", function(event) {
				self.on_select_tab(event.tab_name);
			}).tab_pane({
				tabs: {
					brawls: "Brawls"
					, edit: "Edit"
				//	, admin: "Admin"
				}

				, default_tab: "brawls"
			});

		}

		, destroy: function() {
			var element = this.element;
			this.botname_display.remove();
			this.tabs.tab_pane("destroy");
			this.tabs.remove();
			this.tab_content.remove();

			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, on_select_tab: function(tab_name) {
			var bot_id = this.option("bot_id");
			var bot = BrawlIO.get_bot_by_id(bot_id);
			this.destroy_tab_content();
			if(tab_name === "brawls") {
				this.tab_content.dashboard_bot_brawls({bot: bot});
			} else if(tab_name === "edit") {
				this.tab_content.dashboard_bot_edit({bot: bot});
			}
		}
		
		, destroy_tab_content: function() {
			if(this.tab_content.data("dashboard_bot_brawls")) {
				this.tab_content.dashboard_bot_brawls("destroy");
			}
			if(this.tab_content.data("dashboard_bot_edit")) {
				this.tab_content.dashboard_bot_edit("destroy");
			}
		}
	};

	$.widget("brawlio.dashboard_bot", DashboardBot);

	$.widget("brawlio.dashboard_bot_brawls", {
		options: {
			bot: undefined
		}
		, _create: function() {
			var bot = this.option("bot");

			var rating_text;
			if(bot.rated === false) {
				rating_text = "Unrated";
			} else {
				rating_text = bot.rating + " (" + BrawlIO.get_class_name(bot.rating) + ")";
			}

			var record_text = bot.wins+" wins, " + bot.losses+" losses, " + bot.draws+" draws";

			this.record_summary = $("<div />")	.text(record_text+ "; " + rating_text)
												.addClass("record")
												.appendTo(this.element);

			
			this.challenge_title = $("<div />")	.text("Challenge")
												.addClass("section_header")
												.appendTo(this.element);

			this.challenge_section = $("<div />")	.appendTo(this.element)
													.challenge();
		}
		, destroy: function() {
			var element = this.element;
			this.challenge_section.challenge("destroy");
			this.challenge_section.remove();
			this.challenge_title.remove();

			this.record_summary.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});

	$.widget("brawlio.dashboard_bot_edit", {
		options: {
			bot: undefined
		}
		, _create: function() {
			this.editor_title = $("<div />")	.text("Editor (autosaved)")
												.addClass("section_header")
												.appendTo(this.element);
			this.editor = $("<div />")	.appendTo(this.element)
										.bot_edit({
											bot: this.option("bot")
										});

			this.test_title = $("<div />")	.text("Test")
											.addClass("section_header")
											.appendTo(this.element);

			this.test_text = $("<div />")	.text("Test my bot versus ")
											.css("text-align", "center")
											.appendTo(this.element);

			var self = this;
			this.test_options = [
				{name: "Blank bot", code: ""}
				, {name: "Itself", code: function() {
					return self.editor.bot_edit("get_code")
				}}
			];
			var username = BrawlIO.user.username;
			for(var i = 0; i<BrawlIO.bots.length; i++) {
				var bot = BrawlIO.bots[i];
				var bot_name = bot.name;
				this.test_options.push({name: username+"/"+bot_name, code: $.proxy(function(id) {
					var bot = BrawlIO.get_bot_by_id(id);
					return bot.code;
				}, this, bot.id)});
			}

			this.test_versus_select = $("<select />").appendTo(this.test_text);
			for(var i = 0; i<this.test_options.length; i++) {
				var test_option = this.test_options[i];
				var option = $("<option />").attr("value", i)
											.text(test_option.name)
											.appendTo(this.test_versus_select);
			}
			this.test_text.append(" ");

			var test_versus_button = $("<a />")	.attr("href", "javascript:void(0)")
												.text("Test")
												.addClass("test button")
												.on("click", $.proxy(this.do_test, this))
												.appendTo(this.test_text);

			
		}
		, destroy: function() {
			this.editor_title.remove();
			this.editor.bot_edit("destroy");
			this.editor.remove();
			this.test_title.remove();
			this.test_text.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, do_test: function() {
			this.editor.bot_edit("save");
			var test_option = this.test_options[this.test_versus_select.val()];

			var other_code = test_option.code;
			if($.isFunction(other_code)) {
				other_code = other_code();
			}
			var my_code = this.editor.bot_edit("get_code");


			console.log(my_code, other_code);
		}
	});
}(BrawlIO));
