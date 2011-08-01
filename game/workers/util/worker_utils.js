var Hash = function() {
	this.keys = [];
	this.values = [];
};

(function() {
	this.set = function(key, value) {
		for(var i = 0, len = this.keys.length; i<len; i++) {
			if(key === this.keys[i]) {
				this.values[i] = value;
				return;
			}
		}
		this.keys.push(key);
		this.values.push(value);
	};
	this.get = function(key) {
		for(var i = 0, len = this.keys.length; i<len; i++) {
			if(key === this.keys[i]) {
				return this.values[i];
			}
		}
		return undefined;
	};
	this.get_keys = function() {
		return this.keys;
	};
	this.unset = function(key) {
		for(var i = 0, len = this.keys.length; i<len; i++) {
			if(key === this.keys[i]) {
				delete this.values[i];
				delete this.keys[i];
				return;
			}
		}
	};
}).call(Hash.prototype);

try {
	if(typeof exports !== undefined) {
		exports.Hash = Hash;
	}
}
catch(e) {}
