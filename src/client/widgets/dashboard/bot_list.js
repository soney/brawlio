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

		, create_new_bot: function() {
			var bot_name_prompt = $("<div />").addClass("new_bot");
			var choose_bot_name = $("<div />")	.addClass("choose_name")
												.html("Enter a name for your new bot<span class='star'>*</span>:")
												.appendTo(bot_name_prompt);

			var bot_name_input = $("<input />")	.attr("type", "text")
												.appendTo(bot_name_prompt);
			var submit_button = $("<a />")	.attr("href", "javascript:void(0)")
											.text("Go!")
											.addClass("submit button")
											.appendTo(bot_name_prompt);

			var name_restrictions = $("<div />").addClass("footnote")
												.html("<span class='star'>*</span> 3 to 15 letters, numbers, $, and _. Cannot start with a number.")
												.appendTo(bot_name_prompt);
			
			bot_name_prompt.dialog({
				modal: true
				, resizable: false
				, draggable: false
				, title: "Create new bot"
			});
			console.log("create a new bot");
		}
	};

	$.widget("brawlio.bot_list", BotList);
}(BrawlIO));
