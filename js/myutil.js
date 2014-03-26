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

function autolink(src, attachmentsUrlPrefix, thumbWidth, thumbHeight) {
	var patternAtmosImage = new RegExp('(\\b' + attachmentsUrlPrefix + '[-A-Za-z0-9.]+\\.(gif|jpg|png))', "g");
	var atmosImageContext = {};
	atmosImageContext["original-image-url"] = "$1";
	atmosImageContext["thumbnail-image-url"] = "$1&image_width=" + thumbWidth + "&image_height=" + thumbWidth;
	var atmosImageReplaced = Hogan.compile($("#tmpl-timeline-item-image").text()).render(atmosImageContext);
	// a タグおよびimgタグ内のURLにこれ以降の置換が反応しないように DBLQOT という文字列にしてるので最後に再変換する

	var patternAtmosAttachments = new RegExp('(\\b' + attachmentsUrlPrefix + '[-A-Za-z0-9.]+\\.([A-Za-z0-9]+))', "g");
	var patternUrl = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	var patternAddressUser = /(@([a-zA-Z0-9\-_]+))/g;

	return src.replace(patternAtmosImage, atmosImageReplaced)
			  .replace(patternAtmosAttachments, attachmentsReplacer)
			  .replace(patternUrl, "<a target=\"_blank\" href='$1'>$1</a>")
			  .replace(patternAddressUser, "<a href=\"javascript: void(0);\" onclick=\"atmos.showProfileDialog('$2');\">$1</a>")
			  .replace(/DBLQOT/g, "\"");
}

function attachmentsReplacer(match, p1, p2, offset, string){
	var className = getAttachmentClassName(p2);
	return "<a href=DBLQOT" + p1 + "DBLQOT class=DBLQOTatmos-attachments-dlDBLQOT><i class=DBLQOT" + className + "DBLQOT></i></a>";
}

function getAttachmentClassName(extension) {
	switch (extension) {
		case 'apk':
			var filetype = 'apk2';
			break;
		case 'css':
			var filetype = 'css6';
			break;
		case 'csv':
			var filetype = 'csv';
			break;
		case 'dat':
			var filetype = 'dat';
			break;
		case 'dll':
			var filetype = 'dll3';
			break;
		case 'dmg':
			var filetype = 'dmg2';
			break;
		case 'doc':
			var filetype = 'doc';
			break;
		case 'docx':
			var filetype = 'docx1';
			break;
		case 'exe':
			var filetype = 'exe2';
			break;
		case 'gz':
			var filetype = 'gzip1';
			break;
		case 'html':
			var filetype = 'html8';
			break;
		case 'jar':
			var filetype = 'jar10';
			break;
		case 'js':
			var filetype = 'js3';
			break;
		case 'log':
			var filetype = 'log1';
			break;
		case 'pdf':
			var filetype = 'pdf17';
			break;
		case 'psd':
			var filetype = 'photoshop';
			break;
		case 'ppt':
			var filetype = 'ppt2';
			break;
		case 'pptx':
			var filetype = 'pptx';
			break;
		case 'sql':
			var filetype = 'sql';
			break;
		case 'txt':
			var filetype = 'txt';
			break;
		case 'xls':
			var filetype = 'xls2';
			break;
		case 'xlsx':
			var filetype = 'xlsx1';
			break;
		case 'xml':
			var filetype = 'xml6';
			break;
		case 'zip':
			var filetype = 'zip5';
			break;
		default:
			var filetype = 'bin5';
			break;
	}
	return 'flaticon-' + filetype;
}

function applyThumbnailEvent($target) {
	$target.magnificPopup({
		type:'image',
		closeOnContentClick: true,
		closeBtnInside: false,
		mainClass: 'fp-img-mobile',
		image: {
			verticalFit: true
		},
	});
}

function applyMagicEffect($target, effectClass, delay, afterAction) {
	var $t = $target;
	setTimeout(
		function() {
			$t.addClass(effectClass);
			$t.show();
		},
		delay
	);
	setTimeout(
		function() {
			$t.removeClass(effectClass);
			if (can(afterAction)) {
				afterAction($t);
			}
		},
		delay + 1500
	);
}

function showSuccessNotification(message, actions) {
	showNotification(message, 'success', actions);
}

function showInfoNotification(message, actions) {
	showNotification(message, 'info', actions);
}

function showErrorNotification(message, actions) {
	showNotification(message, 'error', actions);
}

function showNotification(message, type, actions) {
	Messenger().post({
		message: message,
		type: type,
		hideAfter: 6,
		showCloseButton: true,
		actions: actions
	});
}

function getExtension(filename) {
	if (filename.lastIndexOf('.') > -1) {
		return filename.substring(filename.lastIndexOf('.') + 1, filename.length);
	}
	else {
		return '';
	}
}

function extractAddressesUsers(msg) {
       return extract(msg, /(^|\b|[^@\-_a-zA-Z0-9])@([a-zA-Z0-9\-_]+)/g, 2);
}

function extractAddressesGroups(msg) {
       return extract(msg, /(^|\b|[^$\-_a-zA-Z0-9])\$([a-zA-Z0-9\-_]+)/g, 2);
}

function extractHashtags(msg) {
       return extract(msg, /(^|\b|[^#])#([^#@ \n]+)/g, 2);
}

function extractKeywords(msg) {
       return msg.replace(/(^|\b|[^@\-_a-zA-Z0-9])@([a-zA-Z0-9\-_]+)/g, '')
                 .replace(/(^|\b|[^$\-_a-zA-Z0-9])\$([a-zA-Z0-9\-_]+)/g, '')
                 .replace(/(^|\b|[^#])#([^#@ \n]+)/g, '')
                         .split(/\s+/)
                         .filter(function(e) { return typeof(e) !== 'undefined' && e != null && e.length > 0; });
}

function extract(msg, regexPattern, pos) {
       var results = [];
       var matched;
       while (matched = regexPattern.exec(msg)) {
               results.push(matched[pos]);
       }
       return results;
}

$(document).ready(function() {
	Messenger.options = {
   		extraClasses: 'messenger-fixed messenger-on-top messenger-on-right',
   		theme: 'flat'
	};
});
