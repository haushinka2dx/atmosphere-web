var createAtmosConversation = undefined;

(function() {
	function AtmosConversation(id, messageId) {
		this.id(id);
		this.rootId(id + '-root');
		this.mainMessageId(messageId);
		this.scrollbarWasSet = false;
		this._conversation = undefined;
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
		showNewItems : showNewItems,
		updateConversationItemReaction : updateConversationItemReaction,
		refreshMessage : refreshMessage,
		removeMessage : removeMessage,
		setScrollbar : setScrollbar,
	}

	function id(convId) {
		if (can(convId) && convId.length > 0) {
			this._id = convId;
		}
		return this._id;
	}

	function rootId(convRootId) {
		if (can(convRootId) && convRootId.length > 0) {
			this._rootId = convRootId;
		}
		return this._rootId;
	}

	function mainMessageId(convMessageId) {
		if (can(convMessageId) && convMessageId.length > 0) {
			this._mainMessageId = convMessageId;
		}
		return this._mainMessageId;
	}

	function init(beforeConversationElement, backLinkHandler) {
		var that = this;
		var tmpl = Hogan.compile($("#tmpl-conversation").text());
		var context = { "conversation-id": this.id() };
		var generated = tmpl.render(context);
		$(beforeConversationElement).after(generated);
		$("#" + this.id() + "-root a.back").on('click', function(e) {
			if (can(backLinkHandler)) {
				backLinkHandler(that);
			}
		});
		var method = 'GET';
		var data = { "message_ids":this.mainMessageId() };
//Messages.prototype.pnMessageIds = 'message_ids';
//Messages.prototype.pnReplyToMessageId = 'reply_to_message_id';
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] === 1) {
						var tlItem = tlResult['results'][0];
						var tlItemHtml = this.createConversationItem(tlItem, true);
						$("#" + this.id()).prepend(tlItemHtml);
						this.applyItemEvents($("#" + this.id() + ' > div:first'));

						var newItems = $("#" + this.id() + " > div.new-item");
						this.showNewItems(newItems);

						this.setScrollbar();

						// past messages
						var mainReplyToMessageId = tlItem['reply_to'];
						if (can(mainReplyToMessageId) && mainReplyToMessageId.length > 0) {
							this.createPastMessageProcessor(tlItem['reply_to'])();
						}

						// future messages
						this.createFutureMessageProcessor(tlItem['_id'])();
					}
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				console.log(errorThrown);
			},
			this
		);
		atmos.sendRequest(
			atmos.createUrl('/messages/search'),
			method,
			data,
			successCallback,
			failureCallback);
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
					if (tlResult['status'] === 'ok') {
						if (tlResult['count'] === 1) {
							var tlItem = tlResult['results'][0];
							var convItemHtml = this.createConversationItem(tlItem, false);
							$("#" + this.id()).prepend(convItemHtml);

							this.applyItemEvents($("#" + this.id() + " > div:first"));

							// show
							var newItems = $("#" + this.id() + " > div.new-item:first");
							this.showNewItems(newItems);

							//next message
							var replyToMessageId = tlItem['reply_to'];
							if (can(replyToMessageId) && replyToMessageId.length > 0) {
								var processor = this.createPastMessageProcessor(replyToMessageId);
								processor();
							}
						}
					}
				},
				that
			);
			var pastFailureCallback = new CallbackInfo(
				function(xhr, textStatus, errorThrown) {
					console.log(errorThrown);
				},
				that
			);
			atmos.sendRequest(
				atmos.createUrl('/messages/search'),
				'GET',
				{ "message_ids":targetMessageId },
				pastSuccessCallback,
				pastFailureCallback
			);
		}
	}

	function createFutureMessageProcessor(targetMessageId) {
		var that = this;
		return function() {
			var futureSuccessCallback = new CallbackInfo(
				function(res, textStatus, xhr) {
					var tlResult = JSON.parse(res);
					if (tlResult['status'] === 'ok') {
						if (tlResult['count'] > 0) {
							var tlItem = tlResult['results'][0];
							var convItemHtml = this.createConversationItem(tlItem, false);
							$("#" + this.id()).append(convItemHtml);

							this.applyItemEvents($("#" + this.id() + " > div:last"));

							// show
							var newItems = $("#" + this.id() + " > div.new-item:last");
							this.showNewItems(newItems);

							//display next message
							var processor = this.createFutureMessageProcessor(tlItem['_id']);
							processor();
						}
					}
				},
				that
			);
			var futureFailureCallback = new CallbackInfo(
				function(xhr, textStatus, errorThrown) {
					console.log(errorThrown);
				},
				that
			);
			atmos.sendRequest(
				atmos.createUrl('/messages/search'),
				'GET',
				{ "reply_to_message_id":targetMessageId },
				futureSuccessCallback,
				futureFailureCallback
			);
		}
	}

	function createConversationItem(msg, isMain) {
		if (isMain) {
			var tmpl = Hogan.compile($("#tmpl-conversation-item-wrapper-main").text());
		}
		else {
			var tmpl = Hogan.compile($("#tmpl-conversation-item-wrapper").text());
		}
		var context = {};
		context["is-own-message"] = atmos.currentUserId() === msg['created_by'];
		context["conversation-item-message-id"] = msg['_id'];
		context["conversation-item-timestamp"] = utc2jstRelative(msg['created_at']);
		context["conversation-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"];
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
			responseInfo['reaction-icon-class'] = "foundicon-" + resType;
			responseInfo['reaction-count'] = responderUserIds.length;
			reactions.push(responseInfo);
		});
		context["reactions"] = reactions;
		var generated = tmpl.render(context);
		return generated;
	}

	function applyItemEvents(target) {
		$(target).find('a.reaction').on('click', function(e) {
			var targetLink = e.currentTarget;
			var base = $(targetLink).parent().parent();
			var targetMessageId = $(base).find('input[name=message-id]').val();
			var targetMessageBody = $(base).find('input[name=message-body]').val();
			var reactionType = $(targetLink).attr('reaction-type');
			atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody);
		});
		$(target).find('a.reply').on('click', function(e) {
			var targetLink = e.currentTarget;
			var base = $(targetLink).parent().parent();
			var targetMessageId = $(base).find('input[name=message-id]').val();
			var targetMessageBody = $(base).find('input[name=message-body]').val();
			var addressUsers = $(base).find('input[name=message-address-users]').val();
			var addressGroups = $(base).find('input[name=message-address-groups]').val();
			var originalMsgCreatedBy = $(base).find('input[name=message-created-by]').val();

			var addresses = [];
			addresses = addresses.concat(addressUsers.split(' '), addressGroups.split(' '));
			addresses.push('@' + originalMsgCreatedBy);

			var replyType = $(targetLink).attr('reply-type');
			var defaultMessage = '';
			if (replyType === 'quote') {
				defaultMessage = targetMessageBody;
			}
			atmos.showMessageSenderDialog(defaultMessage, targetMessageId, targetMessageBody, addresses);
		});
		$(target).find('a.remove').on('click', function(e) {
			var targetLink = e.currentTarget;
			var targetMessageId = $(targetLink).parent().parent().find('input[name=message-id]').val();
			var targetMessageBody = $(targetLink).parent().parent().find('input[name=message-body]').val();
			atmos.showMessageRemoveDialog(targetMessageId, targetMessageBody);
		});
	}

	function showNewItems(newItems) {
		var delay = 0;
		var delayDelta = 60;
		var animationClasses = 'magictime swashIn';
		var newItemsLength = newItems.length;
		for (var i = 0; i < newItemsLength; i++) {
			var targetNewItem = newItems[i];
			$(targetNewItem).removeClass('new-item');
			(function(){
				var delayms = delay;
				var item = targetNewItem;
				setTimeout(
					function() {
						$(item).addClass(animationClasses);
						$(item).show();
					},
					delayms
				);
			})();
			(function(){
				var delayms = delay + 1500;
				var item = targetNewItem;
				setTimeout(
					function() {
						$(item).removeClass(animationClasses);
					},
					delayms
				);
			})();
			delay += delayDelta;
		}
	}

	function updateConversationItemReaction(msg) {
		var msgId = msg['_id'];
		var reactionPanels = $("#" + this.id() + " article.msg_" + msgId + " div.reaction-panel");
		var responses = msg['responses'];
		Object.keys(responses).forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			reactionPanels.find("a.reaction-count[reaction-type=" + resType + "]").text(responderUserIds.length);
		});
		var reactionTargetArticles = $("#" + this.id() + " article.msg_" + msgId);
		var delay = 0;
		var delayDelta = 60;
		var animationClasses = 'magictime tada';
		for (var i=reactionTargetArticles.length - 1; i >= 0; i--) {
			var targetItem = $(reactionTargetArticles[i]).parent();
			(function(){
				var delayms = delay;
				var item = targetItem;
				setTimeout(
					function() {
						$(item).addClass(animationClasses);
					},
					delayms
				);
			})();
			(function(){
				var delayms = delay + 1500;
				var item = targetItem;
				setTimeout(
					function() {
						$(item).removeClass(animationClasses);
					},
					delayms
				);
			})();
			delay += delayDelta;
		}
	}

	function refreshMessage(messageId) {
		var url = atmos.createUrl("/messages/search");
		var method = 'GET';
		var data = { "message_ids" : messageId };
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] === 1) {
						var tlItem = tlResult['results'][0];
						this.updateConversationItemReaction(tlItem);
					}
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				console.log(errorThrown);
			},
			this
		);
		atmos.sendRequest(
			url,
			method,
			data,
			successCallback,
			failureCallback
		);
	}

	function removeMessage(messageId) {
		var msgId = messageId;
		var removedMessageArticle = $("#" + this.id() + " article.msg_" + msgId);
		var delay = 0;
		var delayDelta = 60;
		var animationClasses = 'magictime holeOut';
		for (var i=removedMessageArticle.length - 1; i >= 0; i--) {
			var targetItem = $(removedMessageArticle[i]).parent();
			(function(){
				var delayms = delay;
				var item = targetItem;
				setTimeout(
					function() {
						$(item).addClass(animationClasses);
					},
					delayms
				);
			})();
			(function(){
				var delayms = delay + 1050;
				var item = targetItem;
				setTimeout(
					function() {
						$(item).remove();
					},
					delayms
				);
			})();
			delay += delayDelta;
r	}
	}

	function setScrollbar() {
		if (this.scrollbarWasSet === false) {
			$('#' + this.id()).parent().perfectScrollbar(atmos.perfectScrollbarSetting);
			this.scrollbarWasSet = true;
		}
	}

	createAtmosConversation = function(id, messageId) {
		return new AtmosConversation(id, messageId);
	}

})();
