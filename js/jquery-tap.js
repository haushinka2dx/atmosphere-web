$.fn.tap = function(func) {
	$.isFunction(func)
		? func.call(this, this)
		: (window.console && window.console.debug(this))
	;
	return this;
};
