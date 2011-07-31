var Team = function(id, active, weight_class, weight_class_name, code, char_limit, user_fk) {
	this.id = id;
	this.active = active;
	this.weight_class = weight_class;
	this.weight_class_name = weight_class_name;
	this.code = code;
	this.char_limit = char_limit;
	this.user_fk = user_fk;
};

(function() {
}).call(Team.prototype);

module.exports = Team;
