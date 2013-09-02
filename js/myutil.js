function can(v) {
	return typeof(v) != 'undefined' && v != null;
}

function escapeHtml(src) {
	return src.replace(/&/g, '&amp;')
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;');
}

function showConfirmDialog(title, message, onOK, onCancel) {
	var dialogId = "mydialog_" + rand(1000000);
	var confirmModalLabelId = dialogId + "label";
	var dialogOKButtonId = dialogId + "OK";

	$("body").tap().append(
	'<div id="' + dialogId + '" class="modal hide fade" role="dialog" tabindex="-1" aria-labelledby="' + confirmModalLabelId + '" aria-hidden="true">'
	+ '	<div class="modal-header"> '
	+ '		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
	+ '		<h3 Id="' + confirmModalLabelId + '">' + title + '</h3>'
	+ '	</div>'
	+ '	<div class="modal-body">'
	+ '		<p>' + message + '</p>'
	+ '	</div>'
	+ '	<div class="modal-footer">'
	+ '		<button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>'
	+ '		<button class="btn btn-primary" id="' + dialogOKButtonId + '">OK</button>'
	+ '	</div>'
	+ '</div>'
	);

	showDialog(dialogId, confirmModalLabelId, dialogOKButtonId, onOK, onCancel);
}

function showDialog(dialogId, confirmModalLabelId, dialogOKButtonId, onOK, onCancel, keepDialog) {
	var okButtonClicked = false;

	var onOKFunc = function() {
		okButtonClicked = true;
		$('#' + dialogId).modal('hide');
	};

	var onHideFunc = function() {
		if (okButtonClicked) {
			if (typeof(onOK) != 'undefined' && onOK != null) {
				onOK();
			}
		}
		else {
			if (typeof(onCancel) != 'undefined' && onCancel != null) {
				onCancel();
			}
		}
		if (!keepDialog) {
			$('#' + dialogId).remove();
		}
	};

	//ダイアログでOKボタンが押された時だけ処理実行
	$('#' + dialogOKButtonId).on('click', onOKFunc);
	$('#' + dialogId).on('hide', onHideFunc);
	$('#' + dialogId).on('hide', function() {
		$('#' + dialogOKButtonId).off('click', onOKFunc);
		$('#' + dialogId).off('hide', onHideFunc);
	});

	$('#' + dialogId).tap().modal();
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
