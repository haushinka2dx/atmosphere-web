var createAtmosSenderPanel = undefined;

(function() {
	function AtmosSenderPanel(id, afterSenderPanel, closedHandler) {
		this.id(id);
		this._panelSelector = "#" + id;
		this.afterSenderPanel(afterSenderPanel);
		// TODO: 本来はDOMから取るべきだが…。
		this.width(300);
		this._visible = false;
		this._closedHandler = closedHandler;
		this.init();
	};
	AtmosSenderPanel.prototype = {
		id : id,
		afterSenderPanel : afterSenderPanel,
		width : width,
		init : init,
		setVariables : setVariables,
		show : show,
		hide : hide,
		close : close,
		selector : selector,
	}

	function selector(descendants) {
		if (can(descendants) && descendants.length) {
			return this._panelSelector + ' ' + descendants;
		}
		else {
			return this._panelSelector;
		}
	}

	function id(panelId) {
		if (canl(panelId)) {
			this._id = panelId;
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

	function init() {
		var that = this;
		$(this.afterSenderPanel()).before(Hogan.compile($("#tmpl-sender-panel").text()).render({ "sender-panel-id": this.id() }));
		$(this.selector("a.sender-panel-close-button")).on('click', function(e) {
			that.hide("normal", function() { that.close(); });
		});

		atmos.applyAutoComplete($(this.selector("textarea")));

		$(this.selector(".sender-panel-footer .ok-button")).on('click', function(e) {
			var message = $(that.selector(":input[name=sender-panel-message]")).val();
			var replyToMsgId = $(that.selector(":input[name=sender-panel-reply-to-msg-id]")).val();
			var sendMessageCallback = new CallbackInfo(
				function(res) {
					if (res.status === 'ok') {
						if ($(that.selector(":input[name=sender-panel-stay-open]")).prop('checked')) {
							that.setVariables('', '', '');
						}
						else {
							that.hide("normal", function() { that.close(); });
						}
					}
				},
				that
			);
			atmos.sendMessage(message, '', can(replyToMsgId) ? replyToMsgId : null, sendMessageCallback);
		});
	}

	function setVariables(message, replyToMsgId, replyToMessage, addresses) {
		if (can(addresses)) {
			addresses.forEach(function(address) {
				if (message.indexOf(address) === -1) {
					message = address + ' ' + message;
				}
			});
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

		$(this.selector(":input:first")).focus();
	}

	function show(speed, callback) {
		if (this._visible === false) {
			this._visible = true;
			$(this.selector()).show(speed, callback);
			//TODO 本来は決め打ちだめだけど
			$(this.afterSenderPanel()).animate({left: "356px" }, 500);
		}
	}

	function hide(speed, callback) {
		if (this._visible === true) {
			this._visible = false;
			$(this.selector()).hide(speed, callback);
			//TODO 本来は決め打ちだめだけど
			$(this.afterSenderPanel()).animate({left: "56px" }, 500);
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
