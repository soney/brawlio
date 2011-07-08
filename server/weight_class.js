var WeightClasses = {
	classes: {
		light: 1,
		middle: 2,
		heavy: 3
	}
	, get_prefix: function(weight_class) {
		if(weight_class == WeightClasses.classes.light) {
			return "light";
		}
		else if(weight_class == WeightClasses.classes.middle) {
			return "middle";
		}
		else {
			return "heavy"
		}
	}
	, get_name: function(weight_class) {
		return WeightClasses.get_prefix(weight_class)+"weight";
	}
	, enumerate: function() {
		return [WeightClasses.classes.light,
				WeightClasses.classes.middle,
				WeightClasses.classes.heavy];
	}
	, num_types: function() {
		return WeightClasses.enumerate().length;
	}
};

module.exports = WeightClasses;
