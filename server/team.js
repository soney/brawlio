var Team = function(id, active, weight_class, weight_class_name, code, char_limit) {
	this.id = id;
	this.active = active;
	this.weight_class = weight_class;
	this.weight_class_name = weight_class_name;
	this.code = code;
	this.char_limit = char_limit;
};

(function() {
}).call(Team.prototype);

module.exports = Team;
