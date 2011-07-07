var User = function(id, username) {
	this.id = id;
	this.username = username;
};

(function() {
}).call(User.prototype);

module.exports = User;
