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


			this.rating_display = $("<span />").addClass("rating");
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
																	dashboard.render_bot(bot_id);
																})
																.text(bot.name)
												)
												.append("&nbsp;&nbsp;")
												.append(this.rating_display)
												.addClass("bot_title")
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

			this.update_stats();
		}

		, destroy: function() {
			var element = this.element;
			this.botname_display.remove();
			this.tabs.tab_pane("destroy");
			this.tabs.remove();
			this.tab_content.remove();

			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, refresh: function() {
			var self = this;
			BrawlIO.get_bots(function(bots) {
				BrawlIO.set_bots(bots);

				var bot_id = self.option("bot_id");
				var bot = BrawlIO.get_bot_by_id(bot_id);

				if(self.tab_content.data("dashboard_bot_brawls")) {
					self.tab_content.dashboard_bot_brawls("option", "bot", bot);
				}

				self.update_stats();
			});
		}

		, on_select_tab: function(tab_name) {
			var bot_id = this.option("bot_id");
			var bot = BrawlIO.get_bot_by_id(bot_id);
			this.destroy_tab_content();
			if(tab_name === "brawls") {
				this.tab_content.dashboard_bot_brawls({bot: bot, dashboard: this});
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

		, update_stats: function() {
			var bot_id = this.option("bot_id");
			var bot = BrawlIO.get_bot_by_id(bot_id);

			var rating_text = BrawlIO.get_rating_str(bot);
			this.rating_display.text(rating_text);
		}
		, brawl_added: function(brawl) {
			if(this.tab_content.data("dashboard_bot_brawls")) {
				this.tab_content.dashboard_bot_brawls("brawl_added", brawl);
			}
		}
	};

	$.widget("brawlio.dashboard_bot", DashboardBot);

	$.widget("brawlio.dashboard_bot_brawls", {
		options: {
			bot: undefined
			, dashboard: undefined
		}
		, _create: function() {
			var bot = this.option("bot");
			var dashboard = this.option("dashboard");
			this.challenge_title = $("<div />")	.text("Challenge")
												.addClass("section_header")
												.appendTo(this.element);

			this.challenge_section = $("<div />")	.appendTo(this.element)
													.challenge();
			this.challenge_section.on("challenge", function(event) {
				var opponent_id = event.opponent_id;
				var my_id = bot.id;

				BrawlIO.get_all_bots(function(bots) {
					var my_bot, opponent_bot;
					for(var i = 0; i<bots.length; i++) {
						var bot = bots[i];
						if(bot.id === my_id) { my_bot = bot; }
						if(bot.id === opponent_id) { opponent_bot = bot; }
						if(my_bot !== undefined && opponent_bot !== undefined) {
							break;
						}
					}
					if($(window).data("brawl_dialog")) {
						$(window).brawl_dialog("destroy");
					}
					$(window).brawl_dialog({
						my_code: my_bot.code
						, opponent_code: opponent_bot.code
						, on_game_over: function(event) {
							var winner = event.winner;
							if(winner === undefined) { // Draw
							} else if(winner.name === "Me") {
								winner = my_id;
							} else {
								winner = opponent_id;
							}
							var brawl = event.brawl;
							var game_log = brawl.get_game_log();
							var stringified_log = game_log.stringify();

							BrawlIO.on_brawl_run(my_id, opponent_id, winner, stringified_log, function() {
								dashboard.refresh();
							});
						}
					});
				});
			});

			this.past_brawls_title = $("<div />")	.text("Past Brawls")
													.addClass("section_header past_brawls")
													.appendTo(this.element);


			this.record_summary = $("<span />")	.addClass("record")
												.appendTo(this.past_brawls_title);
			this.past_brawls = $("<div />")	.appendTo(this.element);
			this.past_brawls.brawl_log({
				bot_id: bot.id
			});

			this.update_stats();
		}
		, destroy: function() {
			var element = this.element;
			this.challenge_section.challenge("destroy");
			this.challenge_section.remove();
			this.challenge_title.remove();

			this.past_brawls_title.remove();
			this.record_summary.remove();
			this.past_brawls.brawl_log("destroy");
			this.past_brawls.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
		, update_stats: function() {
			var bot = this.option("bot");
			var record_text = BrawlIO.get_record_str(bot);
			this.record_summary.text(record_text);
		}
		, _setOption: function( key, value ) {
			// In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
			$.Widget.prototype._setOption.apply( this, arguments );

			switch( key ) {
				case "bot":
					this.update_stats();
				break;
			}
		}

		, brawl_added: function(brawl) {
			this.past_brawls.brawl_log("refresh");
		}
	});

	$.widget("brawlio.dashboard_bot_edit", {
		options: {
			bot: undefined
		}
		, _create: function() {
			this.editor_title = $("<div />")	.text("Editor")
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

			if($(window).data("brawl_dialog")) {
				$(window).brawl_dialog("destroy");
			}
			$(window).brawl_dialog({
				my_code: my_code
				, opponent_code: other_code
			});
		}
	});
}(BrawlIO));
