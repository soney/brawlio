(function(BrawlIO) {
	var DashboardBot = {
		options: {
			dashboard: undefined
			, bot: undefined
		}

		, _create: function() {
			var self = this;
			var element = this.element;
			var dashboard = this.option("dashboard");
			var bot = this.option("bot");
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
					brawls: "Brawl"
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
			this.destroy_tab_content();
			if(tab_name === "brawls") {
				this.tab_content.dashboard_bot_brawls();
			} else if(tab_name === "edit") {
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
		_create: function() {
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
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});

	$.widget("brawlio.dashboard_bot_edit", {
		_create: function() {
			this.editor = $("<div />").appendTo(this.element);
		}
		, destroy: function() {
			this.editor.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
}(BrawlIO));
