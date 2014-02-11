var createAtmosSenderPanel = undefined;

(function() {
	function AtmosSenderPanel(id, afterSenderPanel, closedHandler) {
		this.id(id);
		this.afterSenderPanel(afterSenderPanel);
		// TODO: 本来はDOMから取るべきだが…。
		this.width(300);
		this._visible = false;
		this._closedHandler = closedHandler;
		this._isPrivate = false;
		this._privateMessageClass = 'private-message';
		this.init();
	};
	AtmosSenderPanel.prototype = {
		id : id,
		afterSenderPanel : afterSenderPanel,
		width : width,
		init : init,
		setVariablesForNormalMessage : setVariablesForNormalMessage,
		setVariablesForPrivateMessage : setVariablesForPrivateMessage,
		show : show,
		hide : hide,
		close : close,
		selector : selector,
	}

	function selector(descendants) {
		if (canl(descendants)) {
			return this._panelSelector + ' ' + descendants;
		}
		else {
			return this._panelSelector;
		}
	}

	function id(panelId) {
		if (canl(panelId)) {
			this._id = panelId;
			this._panelSelector = '#' + this._id;
		}
		return this._id;
	}

	function afterSenderPanel(afterPanel) {
		if (can(afterPanel)) {
			this._afterSenderPanel = afterPanel;
		}
		return this._afterSenderPanel;
	}

	function width(panelWidth) {
		if (can(panelWidth) && panelWidth > 0) {
			this._width = panelWidth;
		}
		return this._width;
	}

	function isStartsWithString(str, testStr) {
		if (testStr.length > str.length) {
			return false;
		}
		return str.substring(0, testStr.length) === testStr;
	}

	function init() {
		var that = this;
		$(this.afterSenderPanel()).before(Hogan.compile($("#tmpl-sender-panel").text()).render({ "sender-panel-id": this.id() }));
		$(this.selector("a.sender-panel-close-button")).on('click', function(e) {
			that.hide("normal", function() { that.close(); });
		});

		atmos.applyAutoComplete($(this.selector("textarea")));

		this._dz = $(this.selector("div.attachment-file-dropzone")).dropzone({
			url: atmos.createUrl('/attachments/upload'),
			uploadMultiple: false,
			paramName: 'attachment_file',
			headers: {"atmos-session-id":atmos.atmosSessionId()},
			thumbnailHeight: 100,
			previewTemplate: Hogan.compile($("#tmpl-sender-panel-attachment-file-preview").text()).render({}),
			maxFiles: 1,
			//autoProcessQueue: false
			success: function(file, response) {
				if (!isStartsWithString(file.type, "image/")) {
					$(that.selector("div.attachment-file-dropzone")).append("<div>No Preview</div>");
				}
				
				var $messageArea = $(that.selector(":input[name=sender-panel-message]"));
				var message = $messageArea.val();
				message += ' ' + document.location.protocol + '//' + document.location.host + atmos.createUrl('/attachments/download?id=' + response._id);
				$messageArea.val(message);
			},
		});

		this._dz.on('drop', function() {
			$(that.selector("div.attachment-file-dropzone > div.initial-message")).hide();
		});

		$(this.selector(".sender-panel-footer .ok-button")).on('click', function(e) {
			if (that._isPrivate) {
				var to = $(that.selector(":input[name=sender-panel-to]")).val();
			}
			var message = $(that.selector(":input[name=sender-panel-message]")).val();
			var replyToMsgId = $(that.selector(":input[name=sender-panel-reply-to-msg-id]")).val();
			var sendMessageCallback = new CallbackInfo(
				function(res) {
					if (res.status === 'ok') {
						if ($(that.selector(":input[name=sender-panel-stay-open]")).prop('checked')) {
							if (this._isPrivate) {
								that.setVariablesForPrivateMessage('', '', '', []);
							}
							else {
								that.setVariablesForNormalMessage('', '', '', []);
							}
						}
						else {
							that.hide("normal", function() { that.close(); });
						}
					}
				},
				that
			);
			if (that._isPrivate) {
				atmos.sendPrivate(to, message, can(replyToMsgId) ? replyToMsgId : null, sendMessageCallback);
			}
			else {
				atmos.sendMessage(message, '', can(replyToMsgId) ? replyToMsgId : null, sendMessageCallback);
			}
		});
	}

	function setVariablesForNormalMessage(message, replyToMsgId, replyToMessage, addresses) {
		this._isPrivate = false;
		$(this.selector()).removeClass(this._privateMessageClass);
		if (canl(message)) {
			var messageExists = true;
		}
		if (can(addresses)) {
			addresses.forEach(function(address) {
				if (message.indexOf(address) === -1) {
					message = address + ' ' + message;
				}
			});
		}
		if (messageExists) {
			message = ' QT: ' + message;
		}
		$(this.selector(":input[name=sender-panel-message]")).val('').val(message);
		$(this.selector(":input[name=sender-panel-reply-to-msg-id]")).val('').val(replyToMsgId);
		$(this.selector(".sender-panel-header .sender-panel-original-message")).text('').text(replyToMessage);

		if (canl(replyToMsgId)) {
			$(this.selector(".sender-panel-header .sender-panel-title")).text('Reply Message');
		}
		else {
			$(this.selector(".sender-panel-header .sender-panel-title")).text('New Message');
		}

		$(this.selector(":input[name=sender-panel-to]")).parent().hide();

		var $dzRoot = $(this.selector("div.attachment-file-dropzone"));
		$dzRoot.children().not("div.initial-message").remove();
		$dzRoot.find("div.initial-message").show();

		this._dz.init();

		$(this.selector(":input:first")).focus();
	}

	function setVariablesForPrivateMessage(message, replyToMsgId, replyToMessage, toAddresses) {
		this._isPrivate = true;
		$(this.selector()).addClass(this._privateMessageClass);

		var to = toAddresses.filter(function(address) { return canl(address); } ).join(' ');
		$(this.selector(":input[name=sender-panel-to]")).val('').val(to);
		if (canl(message)) {
			message = ' QT: ' + message;
		}
		$(this.selector(":input[name=sender-panel-message]")).val('').val(message);
		$(this.selector(":input[name=sender-panel-reply-to-msg-id]")).val('').val(replyToMsgId);
		$(this.selector(".sender-panel-header .sender-panel-original-message")).text('').text(replyToMessage);

		if (canl(replyToMsgId)) {
			$(this.selector(".sender-panel-header .sender-panel-title")).text('Reply Private Message');
		}
		else {
			$(this.selector(".sender-panel-header .sender-panel-title")).text('New Private Message');
		}

		$(this.selector(":input[name=sender-panel-to]")).parent().show();

		if (canl(to)) {
			$(this.selector(":input[name=sender-panel-message]")).focus();
		}
		else {
			$(this.selector(":input[name=sender-panel-to]")).focus();
		}
	}

	function show(speed, callback) {
		if (this._visible === false) {
			this._visible = true;
			$(this.selector()).show(speed);
			//TODO 本来は決め打ちだめだけど
			var width = this._width + 56;
			$(this.afterSenderPanel()).animate({left: width + "px" }, 500, callback);
			$(this.afterSenderPanel()).find(".contents:first").css("padding-right", width);
		}
	}

	function hide(speed, callback) {
		if (this._visible === true) {
			this._visible = false;
			$(this.selector()).hide(speed);
			//TODO 本来は決め打ちだめだけど
			$(this.afterSenderPanel()).animate({left: "56px" }, 500, callback);
			$(this.afterSenderPanel()).find(".contents:first").css("padding-right", 56);
		}
	}

	function close() {
		$(this.selector()).remove();
		if (can(this._closedHandler)) {
			this._closedHandler();
		}
	}

	createAtmosSenderPanel = function(id, afterSenderPanel, closedHandler) {
		return new AtmosSenderPanel(id, afterSenderPanel, closedHandler);
	}
})();
