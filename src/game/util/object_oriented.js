(function(BrawlIO) {
	var extend = function (subclass, superclass) {
			var Dummy = function(){};
			Dummy.prototype = superclass.prototype;
			subclass.prototype = new Dummy();
			subclass.prototype.constructor = subclass;
			subclass.superclass = superclass;
			subclass.superproto = superclass.prototype;
		};

	BrawlIO.oo_extend = extend;
}(BrawlIO));
