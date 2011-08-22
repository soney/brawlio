var WeightClasses = {
	classes: {
		standard: 0
	}
	, get_prefix: function(weight_class) {
		if(weight_class == WeightClasses.classes.light) {
			return "light";
		}
		else if(weight_class == WeightClasses.classes.middle) {
			return "middle";
		}
		else {
			return "heavy";
		}
	}
	, get_name: function(weight_class) {
		return WeightClasses.get_prefix(weight_class)+"weight";
	}
	, enumerate: function() {
		return [WeightClasses.classes.standard];
	}
	, num_types: function() {
		return WeightClasses.enumerate().length;
	}
	, get_char_limit: function(weight_class) {
		if(weight_class === WeightClasses.classes.standard) {
			return 5000;
		}
	}
};

module.exports = WeightClasses;
