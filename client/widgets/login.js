define(["client/util/login_utils", "vendor/jquery", "vendor/jquery-ui"], function() {
	$.widget("brawlio.login", {
		options: {
			login_text: "Login"
			, register_text: "Register"
		},
		_create: function() {
			var element = this.element,
				options = this.options,
				self = this;

			var login_form = $("<div />")	.appendTo(element);

			var user_input = $("<input />")	.appendTo(login_form)
											.attr("id", "user")
											.val("soney")
											;
			var password_input = $("<input type = 'password'/>")	.appendTo(login_form)
																	.attr("id", "pass")
																	.val("adobe")
																	;
			var login_button = $("<a />")	.text("Login")
											.attr("href", "javascript:void(0)")
											.appendTo(login_form)
											.click(function() {
												self.login();
											})
											.click()
											;
		}
		, destory: function() {
			 $.Widget.prototype.destroy.apply(this, arguments);
		}

		, login: function() {
			var element = this.element;

			var user_id = $("input#user", element).val();
			var password = $("input#pass", element).val();

			BrawlIO.login({
				user: user_id
				, password: password
			});
		}

		, succeess: function(user) {
			console.log(user);
		}

		, failure: function(explanation) {
			console.log(explanation);
		}

	});
});
