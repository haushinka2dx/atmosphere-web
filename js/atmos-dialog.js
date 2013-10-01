var createAtmosDialog = undefined;

(function() {
	function AtmosDialog(title, messages, inputFields, okButtonEnabled, closedHandler) {
		this.id(uuid());
		this.title(title);
		this.messages(messages);
		this.inputFields(inputFields);
		this.okButtonEnabled(okButtonEnabled);
		this.closedHandler(closedHandler);
	};

	AtmosDialog.prototype = {
		id : id,
		title : title,
		messages : messages,
		inputFields : inputFields,
		okButtonEnabled : okButtonEnabled,
		closedHandler : closedHandler,
		show : show,
		close : close,
		createDialog : createDialog,
		collectInputs : collectInputs,
	}

	function id(dlgId) {
		if (can(dlgId) && dlgId.length > 0) {
			this._id = dlgId;
		}
		return this._id;
	}

	function title(dlgTitle) {
		if (can(dlgTitle) && dlgTitle.length > 0) {
			this._title = dlgTitle;
		}
		return this._title;
	}

	function messages(dlgMessages) {
		if (can(dlgMessages) && dlgMessages.length > 0) {
			this._messages = dlgMessages;
		}
		return this._messages;
	}

	function inputFields(dlgInputFields) {
		if (can(dlgInputFields) && dlgInputFields.length > 0) {
			this._inputFields = dlgInputFields;
		}
		return this._inputFields;
	}

	function okButtonEnabled(dlgOkButtonEnabled) {
		if (can(dlgOkButtonEnabled)) {
			this._okButtonEnabled = dlgOkButtonEnabled;
		}
		return this._okButtonEnabled;
	}

	function closedHandler(dlgClosedHandler) {
		if (can(dlgClosedHandler)) {
			this._closedHandler = dlgClosedHandler;
		}
		return this._closedHandler;
	}

	function createDialog() {
		if (this.generatedDialog) {
			return this.generatedDialog;
		}
		var tmpl = Hogan.compile($("#tmpl-modal-dialog").text());
		var context = {};
		context["modal-dialog-id"] = this.id();
		context["modal-dialog-title"] = this.title();
		var msgs = [];
		var argMessages = this.messages();
		if (can(argMessages)) {
			for (var i=0; i<argMessages.length; i++) {
				var msg = {};
				msg['modal-dialog-message'] = argMessages[i];
				msgs.push(msg);
			}
		}
		context["modal-dialog-messages"] = msgs;
		var inputs = [];
		var fields = this.inputFields();
		if(can(fields)) {
			for (var i=0; i<fields.length; i++) {
				var field = {};
				field['is-textarea'] = fields[i]['is-textarea'];
				field['input-type'] = fields[i]['input-type'];
				field['input-place-holder'] = fields[i]['input-place-holder'];
				field['input-name'] = fields[i]['input-name'];
				field['input-id'] = fields[i]['input-id'];
				field['input-value'] = fields[i]['input-value'];
				field['has-label'] = can(fields[i]['input-label-text']) && fields[i]['input-label-text'].length > 0;
				field['input-label-text'] = fields[i]['input-label-text'];
				inputs.push(field);
			}
		}
		context["modal-dialog-inputs"] = inputs;
		context["ok-button-enabled"] = this.okButtonEnabled();
		this.generatedDialog = tmpl.render(context);
		return this.generatedDialog;
	}

	function show() {
		var dialogDom = this.createDialog();
		$("body").append(dialogDom);

		//bind event
		var that = this;
		$("." + this.id() + "-atmos-modal-ok-button").on('click', function(ev) {
			that.close('ok');
		});
		$("." + this.id() + "-atmos-modal-close-button").on('click', function(ev) {
			that.close('close');
		});

		atmos.applyAutoComplete($("#" + this.id() + " textarea"));

		$("#" + this.id()).show();
		$("input[type='text'],input[type='password'],textarea", "#" + this.id() + " .atmos-modal-wrapper .atmos-modal-body").first().focus();
	}

	function close(action, remainDom) {
		$("#" + this.id()).hide();
		$("." + this.id() + "-atmos-modal-ok-button").off('click');
		$("." + this.id() + "-atmos-modal-close-button").off('click');

		var result = {
			"action" : action,
			"inputs" : this.collectInputs(),
		};
		if (can(this.closedHandler())) {
			this.closedHandler()(result);
		}
		if (!remainDom) {
			$("#" + this.id()).remove();
		}
	}

	function collectInputs() {
		var inputs = {};
		var inputList = $("#" + this.id() + " > div > div > div.atmos-modal-body > ul > li > input,textarea");
		for (var i=0; i<inputList.length; i++) {
			var type = $(inputList[i]).attr('type');
			if (type === 'checkbox') {
				if($(inputList[i]).prop('checked')) {
					inputs[inputList[i]['name']] = inputList[i]['value'];
				}
			}
			else {
				inputs[inputList[i]['name']] = inputList[i]['value'];
			}
		}

		return inputs;
	}

	createAtmosDialog = function(title, messages, inputFields, okButtonEnabled, closedHandler) {
		return new AtmosDialog(title, messages, inputFields, okButtonEnabled, closedHandler);
	}

})();
