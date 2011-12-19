(function() {
	var TabPane = {
		options: {
			tabs: {}
			, default_tab: undefined
		}

		, _create: function() {
			var tabs = this.option("tabs");
			var element = this.element;

			element.addClass("tab_pane");

			for(var tab_id in tabs) {
				if(tabs.hasOwnProperty(tab_id)) {
					var tab_text = tabs[tab_id];

					var tab_link = $("<a />")	.attr("href", "javascript:void(0)")
												.text(tab_text)
												.click($.proxy(this.on_tab_clicked, this, tab_id));

					var tab = $("<span />")	.addClass("tab")
											.appendTo(element)
											.append(tab_link)
											.attr("id", tab_id);

				}
			}

			this.select_tab(this.option("default_tab"));
		}

		, destroy: function() {
			this.element.children().remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
		
		, on_tab_clicked: function(tab_name) {
			this.select_tab(tab_name);
		}

		, select_tab: function(tab_name) {
			this.element.trigger({
				type: "select"
				, tab_name: tab_name
			});
			var tab = $("> span.tab#"+tab_name, this.element);
			var other_tabs = $("> span.tab", this.element).not(tab);

			tab.addClass("selected").removeClass("not_selected");
			other_tabs.removeClass("selected").addClass("not_selected");
		}
	};

	$.widget("brawlio.tab_pane", TabPane);
}());
