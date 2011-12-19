(function() {
	var ValidatedInput = {
		options: {
			client_validation: function(inp) {
				if(inp.length < 3) {
					return { passed: false, reason: "Must be longer than 3 characters"};
				} else if(inp.length > 15) {
					return { passed: false, reason: "Must be shorter than 15 characters"};
				} else {
					var starts_with_letter_regex = /^[a-zA-Z_$]/;
					var regex = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
					if(inp.match(starts_with_letter_regex) === null) {
						return { passed: false, reason: "Must start with a letter, $, or _"};
					} else if(inp.match(regex) === null) {
						return { passed: false, reason: "Must contain letters, numbers, $, and _"};
					} else {
						return { passed: true };
					}
				}
			}

			, server_validation: undefined
			, update_timeout: 200
			, submit_button_text: "Go!"
			, default_inp_value: ""
		}

		, _create: function() {
			var element = this.element;
			var self = this;

			this.input = $("<input />")	.addClass("validated_input")
										.attr({
											type: "text"
											, size: 18
											, maxlength: 15
										})
										.val(this.option("default_inp_value"))
										.focus()
										.select()
										.appendTo(element);
			this.submit_button = $("<a />")	.attr("href", "javascript:void(0)")
											.addClass("button")
											.appendTo(element);
			this.submit_button.text(this.option("submit_button_text"));
			this.validation_result = $("<div />")	.addClass("validation_result")
													.appendTo(element);


			var last_check = this.option("default_inp_value");
			var client_validation = this.option("client_validation");
			var server_validation = this.option("server_validation");

			var do_check = function(inp) {
				if(last_check === inp) { return; }
				else { last_check = inp; }

				var client_validation_result = client_validation(inp);

				if(client_validation_result.passed === false) {
					self.validation_result.text(client_validation_result.reason)
										  .addClass("failed")
										  .removeClass("succeeded");
					self.input.addClass("failed").removeClass("succeeded");
				} else {
					self.validation_result.removeClass("failed")
										  .addClass("succeeded");
					self.input.removeClass("failed").removeClass("succeeded");

					if(server_validation !== undefined) {
						server_validation(inp, function(is_ok, message) {
							if(is_ok) {
								self.validation_result.removeClass("failed")
													  .addClass("succeeded");
								self.input.addClass("succeeded").removeClass("failed");
							} else {
								self.validation_result.addClass("failed")
													  .removeClass("succeeded");
								self.input.removeClass("succeeded").addClass("failed");
							}
							self.validation_result.text(message || "");
						});
					} else {
						self.validation_result.text("");
					}
				}
			};

			var timeout_id;
			var check = function(inp) {
				if(timeout_id !== undefined) {
					window.clearTimeout(timeout_id);
				}

				timeout_id = window.setTimeout(function() {
					do_check(inp);
				}, self.option("update_timeout"));
			};

			this.input	.focus()
						.change(function(event) {
							var inp = $(this).val();
							check(inp);
						})
						.keyup(function() {
							$(this).change();
						})
						.keydown(function(event) {
							if(event.keyCode === 13) {
								self.submit_button.click();
							}
						});

			this.submit_button.click(function() {
				var inp = $(self.input).val();
				element.trigger({
					type: "submit"
					, value: inp
				});
			});
		}

		, destroy: function() {
			var element = this.element;
			this.input.remove();
			this.submit_button.remove();
			this.validation_result.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};

	$.widget("brawlio.validated_input", ValidatedInput);
}());
