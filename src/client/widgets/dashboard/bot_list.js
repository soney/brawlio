(function(BrawlIO) {
	var BotList = {
		options: {
			dashboard: undefined
		}

		, _create: function() {
			var element = this.element;
			element.addClass("sidebar_item");
			this.header = $("<div />")	.addClass("sidebar_header")
										.html("My&nbsp;bots&nbsp;")
										.appendTo(element);
			this.bot_count = $("<span />")	.addClass("bot_count")
											.text("(0)")
											.appendTo(this.header);

			this.bot_list = $("<div />").addClass("sidebar_content")
										.appendTo(element);
			
			this.footer = $("<div />")	.addClass("sidebar_footer")
										.appendTo(element);

			this.add_bot_button = $("<a />").attr("href", "javascript:void(0)")
											.addClass("add_bot button")
											.html("Create&nbsp;new&nbsp;bot")
											.on("click", $.proxy(this.create_new_bot, this))
											.appendTo(this.header);
			
			this.update_bots();
		}

		, destroy: function() {
			var element = this.element;
			element.removeClass("bot_list");

			this.header.remove();
			this.bot_count.remove();
			this.bot_list.remove();
			this.add_bot_button.remove();
			this.footer.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, update_bots: function() {
			var bots = BrawlIO.bots;
			this.set_bot_count(bots.length);

			this.bot_list.children().remove();

			for(var i = 0; i<bots.length; i++) {
				var bot_row = this.get_bot_row(bots[i]);
				this.bot_list.append(bot_row);
			}
		}

		, get_bot_row: function(bot) {
			var dashboard = this.option("dashboard");
			var bot_row = $("<div />")	.addClass("bot row");

			var link = $("<a />")	.attr("href", "javascript:void(0)")
									.appendTo(bot_row)
									.click(function() {
										dashboard.render_bot(bot.id);
									});

			var bot_name = $("<span />").text(bot.name)
										.addClass("name");

			var rating;
			if(bot.rated) {
				rating = bot.rating;
			} else {
				rating = "Unrated";
			}
			var bot_rating = $("<span />")	.text(rating)
											.addClass("rating");
			
			link	.append(bot_name)
					.append(bot_rating);
			return bot_row;
		}

		, set_bot_count: function(count) {
			this.bot_count.text("("+count+")");
		}

		, create_new_bot: function() {
			var self = this;
			var bot_name_prompt = $("<div />")	.addClass("new_bot");
			var choose_bot_name = $("<div />")	.addClass("choose_name")
												.html("Enter a name for your new bot<span class='star'>*</span>:")
												.appendTo(bot_name_prompt);

			var default_inp_value = "bot_"+BrawlIO.bots.length;

			var validated_input = $("<div />").validated_input({
			  server_validation: function(inp, callback) {
				for(var i = 0; i<BrawlIO.bots.length; i++) {
					var bot = BrawlIO.bots[i];
					if(bot.name === inp) {
						callback(false, "You already have a bot named '"+inp+"'");
						return;
					}
				}
				callback(true);
			  }
			  , default_inp_value: default_inp_value
			}).appendTo(bot_name_prompt);



			var name_restrictions = $("<div />").addClass("footnote")
												.html("<span class='star'>*</span> 3 to 15 letters, numbers, $, and _. Cannot start with a number.")
												.appendTo(bot_name_prompt);
			
			bot_name_prompt.dialog({
				modal: true
				, resizable: false
				, draggable: false
				, title: "Create new bot"
			});

			validated_input.on("submit", function(event) {
				var bot_name = event.value;
				BrawlIO.add_bot(bot_name, function(bot_id) {
					if(bot_id !== null) {
						BrawlIO.get_bots(function(bots) {
							BrawlIO.set_bots(bots);
							self.update_bots();
						});

						bot_name_prompt.dialog("close").dialog("destroy");
					}
				});
			});
		}
	};

	$.widget("brawlio.bot_list", BotList);
}(BrawlIO));
