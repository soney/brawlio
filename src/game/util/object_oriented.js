(function(BrawlIO) {
	var extend = function (subclass, superclass) {
			var Dummy = function(){};
			Dummy.prototype = superclass.prototype;
			subclass.prototype = new Dummy();
			subclass.prototype.constructor = function() {
				var old_super_constructor;
				var has_super_constructor_property = this.hasOwnProperty("super_constructor");
				if(has_super_constructor_property) {
					old_super_constructor = this.super_constructor;
				}
				this.super_constructor = superclass.constructor;
				var rv = subclass.apply(this, arguments);
				if(has_super_constructor_property) {
					this.super_constructor = old_super_constructor;
				} else {
					delete this.super_constructor;
				}
				return rv;
			};
			subclass.superclass = superclass;
			subclass.superproto = superclass.prototype;
		};

	BrawlIO.oo_extend = extend;
}(BrawlIO));
