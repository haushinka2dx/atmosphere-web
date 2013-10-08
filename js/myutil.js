function can(v) {
	return typeof(v) != 'undefined' && v != null;
}

function canl(v) {
	return can(v) && (typeof(v) === 'function' || v.length > 0);
}

function escapeHtml(src) {
	return src.replace(/&/g, '&amp;')
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;');
}

function uuid() {
	var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }   
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4() +S4());
}

function rand(max) {
	var min = 1;
	return Math.floor(Math.random() * (max - min + 1)) + min
}

var isJson = function(arg){
    arg = (typeof(arg) == "function") ? arg() : arg;
    if(typeof(arg) != "string"){return false;}
    try{arg = (!JSON) ? eval("(" + arg + ")") : JSON.parse(arg);return true;}catch(e){return false;}
}

function utc2jst(utcString) {
	var utc = new Date(utcString);
	return utc.toLocaleString();
}

function utc2jstRelative(utcString) {
	var utc = new Date(utcString);
	var current = new Date();
	var diffSeconds = (current - utc) / 1000;
	if (diffSeconds > 86400) {
		return utc.toLocaleDateString();
	}
	else {
		return utc.toLocaleTimeString();
	}
}

function autolink(src) {
	var pattern = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	return src.replace(pattern, "<a target=\"_blank\" href='$1'>$1</a>");
}
