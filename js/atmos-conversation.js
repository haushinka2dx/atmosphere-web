var AtmosConversation = (function() {
	function AtmosConversation(id, messageId) {
		this.id(id);
		this.rootId(id + '-root');
		this.mainMessageId(messageId);
		this.scrollbarWasSet = false;
		this._conversation = undefined;
		this._searchUrl = atmos.createUrl('/messages/search');
	};
	AtmosConversation.prototype = {
		id : id,
		rootId : rootId,
		mainMessageId : mainMessageId,
		init : init,
		show : show,
		hide : hide,
		close : close,
		createPastMessageProcessor : createPastMessageProcessor,
		createFutureMessageProcessor : createFutureMessageProcessor,
		createConversationItem : createConversationItem,
		applyItemEvents : applyItemEvents,
		updateConversationItemReaction : updateConversationItemReaction,
		refreshMessage : refreshMessage,
		removeMessage : removeMessage,
		setScrollbar : setScrollbar,
		selector : selector,
	}

	function id(convId) {
		if (canl(convId)) {
			this._id = convId;
			this._thisSelector = '#' + this._id;
		}
		return this._id;
	}

	function rootId(convRootId) {
		if (canl(convRootId)) {
			this._rootId = convRootId;
		}
		return this._rootId;
	}

	function mainMessageId(convMessageId) {
		if (canl(convMessageId)) {
			this._mainMessageId = convMessageId;
		}
		return this._mainMessageId;
	}

	function init(beforeConversationElement, backLinkHandler) {
		var that = this;
		$(beforeConversationElement).after(Hogan.compile($("#tmpl-conversation").text()).render({ "conversation-id": this.id() }));
		$("#" + this.rootId() + " a.back").on('click', function(e) {
			if (can(backLinkHandler)) {
				backLinkHandler(that);
			}
		});

		this.applyItemEvents($(this.selector()));

		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok' && tlResult['count'] === 1) {
					var tlItem = tlResult['results'][0];
					$(this.selector()).prepend(this.createConversationItem(tlItem, true));

					createHyperLink($(this.selector('> div:first .conversation-item-message')));

					showNewItems($(this.selector("> div.new-item")));

					this.setScrollbar();

					// past messages
					var mainReplyToMessageId = tlItem['reply_to'];
					if (canl(mainReplyToMessageId)) {
						this.createPastMessageProcessor(tlItem['reply_to'])();
					}

					// future messages
					this.createFutureMessageProcessor(tlItem['_id'])();
				}
			},
			this
		);
		atmos.sendRequest(
			this._searchUrl,
			'GET',
			{ "message_ids":this.mainMessageId() },
			successCallback);
	}

	function show(speed, callback) {
		$("#" + this.rootId()).show(speed, callback);
	}

	function hide(speed, callback) {
		$("#" + this.rootId()).hide(speed, callback);
	}

	function close() {
		$("#" + this.rootId()).remove();
	}

	function createPastMessageProcessor(targetMessageId) {
		var that = this;
		return function() {
			var pastSuccessCallback = new CallbackInfo(
				function(res, textStatus, xhr) {
					var tlResult = JSON.parse(res);
					if (tlResult['status'] === 'ok' && tlResult['count'] === 1) {
						var tlItem = tlResult['results'][0];
						$(this.selector()).prepend(this.createConversationItem(tlItem, false));

						createHyperLink($(this.selector('> div:first .conversation-item-message')));

						// show
						showNewItems($(this.selector("> div.new-item:first")));

						//next message
						var replyToMessageId = tlItem['reply_to'];
						if (canl(replyToMessageId)) {
							this.createPastMessageProcessor(replyToMessageId)();
						}
					}
				},
				that
			);
			atmos.sendRequest(
				that._searchUrl,
				'GET',
				{ "message_ids":targetMessageId },
				pastSuccessCallback
			);
		}
	}

	function createFutureMessageProcessor(targetMessageId) {
		var that = this;
		return function() {
			var futureSuccessCallback = new CallbackInfo(
				function(res, textStatus, xhr) {
					var tlResult = JSON.parse(res);
					if (tlResult['status'] === 'ok' && tlResult['count'] > 0) {
						var tlItem = tlResult['results'][0];
						$(this.selector()).append(this.createConversationItem(tlItem, false));

						createHyperLink($(this.selector('> div:last .conversation-item-message')));

						// show
						showNewItems($(this.selector("> div.new-item:last")));

						//display next message
						this.createFutureMessageProcessor(tlItem['_id'])();
					}
				},
				that
			);
			atmos.sendRequest(
				that._searchUrl,
				'GET',
				{ "reply_to_message_id":targetMessageId },
				futureSuccessCallback
			);
		}
	}

	function createConversationItem(msg, isMain) {
		var context = {};
		context["is-own-message"] = atmos.currentUserId() === msg['created_by'];
		context["conversation-item-message-id"] = msg['_id'];
		context["conversation-item-timestamp"] = utc2jstRelative(msg['created_at']);
		context["conversation-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"] + '&image_width=48&image_height=48';
		context["conversation-item-username"] = msg["created_by"];
		context["conversation-item-message"] = msg["message"];
		var addresses = msg["addresses"];
		if (can(addresses)) {
			var addressUsers = addresses['users'];
			if (can(addressUsers)) {
				context["conversation-item-address-users"] = addressUsers.map(function(addressUser) { return '@' + addressUser; }).join(' ');
			}
			var addressGroups = addresses['groups'];
			if (can(addressGroups)) {
				context["conversation-item-address-groups"] = addressGroups.map(function(addressGroup) { return '$' + addressGroup; }).join(' ');
			}
		}
		var reactions = [];
		var responses = msg['responses'];
		Object.keys(responses).sort().forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			var responseInfo = {};
			responseInfo['reaction-type'] = resType;
			responseInfo['reaction-icon-class'] = "atmos-icon-action-" + resType;
			responseInfo['reaction-count'] = responderUserIds.length;
			reactions.push(responseInfo);
		});
		context["reactions"] = reactions;
		if (isMain) {
			var tmplId = 'tmpl-conversation-item-wrapper-main';
		}
		else {
			var tmplId = 'tmpl-conversation-item-wrapper';
		}
		return Hogan.compile($('#' + tmplId).text()).render(context);
	}

	function createHyperLink($message) {
		$message.html(autolink($message.html(), atmos._attachmentAPIBaseForRegEx, 200, 200));
		applyThumbnailEvent($message.find('a.atmos-image'));
	}

	function applyItemEvents($conversationItems) {
		$conversationItems.on('click', 'a.reaction', function(e) {
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			var reactionType = $(targetLink).attr('reaction-type');
			atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody, false);
		});
		$conversationItems.on('click', 'div.conversation-item-user', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($(e.target).parents('.conversation-item-wrapper').find('div.conversation-item-username').text());
		});
		$conversationItems.on('click', 'header.conversation-item-header > div.conversation-item-username', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($(e.target).text());
		});
		$conversationItems.on('click', 'a.reply', function(e) {
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			var addressUsers = $base.find('input[name=message-address-users]').val();
			var addressGroups = $base.find('input[name=message-address-groups]').val();
			var originalMsgCreatedBy = $base.find('input[name=message-created-by]').val();

			var addresses = [];
			addresses = addresses.concat(addressUsers.split(' '), addressGroups.split(' '));
			addresses.push('@' + originalMsgCreatedBy);
			addresses = addresses.filter(function(v) { return v !== '@' + atmos.currentUserId(); });

			var replyType = $(targetLink).attr('reply-type');
			var defaultMessage = '';
			if (replyType === 'quote') {
				defaultMessage = targetMessageBody;
			}
			atmos.showMessageSenderPanel(defaultMessage, targetMessageId, targetMessageBody, addresses, false);
		});
		$conversationItems.on('click', 'a.remove', function(e) {
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			atmos.showMessageRemoveDialog(targetMessageId, targetMessageBody, false);
		});
	}

	function showNewItems($newItems) {
		var delay = 300;
		$newItems.removeClass('new-item').fadeIn(delay);
		return delay;
	}

	function updateConversationItemReaction(msg) {
		var msgId = msg['_id'];
		var reactionPanels = $(this.selector("article.msg_" + msgId + " div.reaction-panel"));
		var responses = msg['responses'];
		Object.keys(responses).forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			reactionPanels.find("a.reaction-count[reaction-type=" + resType + "]").text(responderUserIds.length);
		});
		var $reactionTargetArticles = $(this.selector("article.msg_" + msgId));
		var delay = 0;
		$($reactionTargetArticles.get().reverse()).each(function(index) {
			applyMagicEffect($(this).parent(), 'magictime tada', delay);
			delay += 60;
		});
	}

	function refreshMessage(messageId) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] === 1) {
						this.updateConversationItemReaction(tlResult['results'][0]);
					}
				}
			},
			this
		);
		atmos.sendRequest(
			this._searchUrl,
			'GET',
			{ "message_ids" : messageId },
			successCallback
		);
	}

	function removeMessage(messageId) {
		var $removedMessageArticle = $(this.selector("article.msg_" + messageId));
		var delay = 0;
		$($removedMessageArticle.get().reverse()).each(function(index) {
			applyMagicEffect($(this).parent(), 'magictime holeOut', delay, function($target) { $target.remove(); });
			delay += 60;
		});
	}

	function setScrollbar() {
		if (this.scrollbarWasSet === false) {
			$(this.selector()).parent().perfectScrollbar(atmos.perfectScrollbarSetting());
			this.scrollbarWasSet = true;
		}
	}

	function selector(descendants) {
		if (canl(descendants)) {
			return this._thisSelector + ' ' + descendants;
		}
		else {
			return this._thisSelector;
		}
	}

	return AtmosConversation;
})();
