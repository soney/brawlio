var User = function(id, username, email) {
	this.id = id;
	this.username = username;
	this.email = email;
};

(function() {
}).call(User.prototype);

module.exports = User;
