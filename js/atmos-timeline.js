var createAtmosTimeline = undefined;

(function() {
	function AtmosTimeline(id, name, description, url, searchCondition) {
		this.id(id);
		this.rootId(id + '-root');
		this.name(name);
		this.description(description);
		this.url(url);
		this.searchCondition(searchCondition);
		this.scrollbarWasSet = false;
	};
	AtmosTimeline.prototype = {
		id : id,
		rootId : rootId,
		name : name,
		description : description,
		url : url,
		searchCondition : searchCondition,
		alreadyReadDateTime : alreadyReadDateTime,
		latestMessageDateTime : latestMessageDateTime,
		oldestMessageDateTime : oldestMessageDateTime,
		createParameters : createParameters,
		createParametersReadMore : createParametersReadMore,
		init : init,
		show : show,
		hide : hide,
		readMore : readMore,
		createTimelineItem : createTimelineItem,
		updateTimelineItemReaction : updateTimelineItemReaction,
		refreshMessage : refreshMessage,
		removeMessage : removeMessage,
		setScrollbar : setScrollbar,
	}

	function id(tlId) {
		if (canl(tlId)) {
			this._id = tlId;
		}
		return this._id;
	}

	function rootId(tlRootId) {
		if (canl(tlRootId)) {
			this._rootId = tlRootId;
		}
		return this._rootId;
	}

	function name(tlName) {
		if (canl(tlName)) {
			this._name = tlName;
		}
		return this._name;
	}

	function description(tlDescription) {
		if (canl(tlDescription)) {
			this._description = tlDescription;
		}
		return this._description;
	}

	function alreadyReadDateTime(tlAlreadyReadDateTime) {
		if (canl(tlAlreadyReadDateTime)) {
			this._alreadyReadDateTime = tlAlreadyReadDateTime;
		}
		return this._alreadyReadDateTime;
	}

	function latestMessageDateTime(tlLatestMessageDateTime) {
		if (canl(tlLatestMessageDateTime)) {
			if (!can(this._latestMessageDateTime)) {
				this._latestMessageDateTime = tlLatestMessageDateTime;
			}
			else if (tlLatestMessageDateTime > this._latestMessageDateTime) {
				this._latestMessageDateTime = tlLatestMessageDateTime;
			}
		}
		return this._latestMessageDateTime;
	}

	function oldestMessageDateTime(tlOldestMessageDateTime) {
		if (canl(tlOldestMessageDateTime)) {
			if (!can(this._oldestMessageDateTime)) {
				this._oldestMessageDateTime = tlOldestMessageDateTime;
			}
			else if (tlOldestMessageDateTime < this._oldestMessageDateTime) {
				this._oldestMessageDateTime = tlOldestMessageDateTime;
			}
		}
		return this._oldestMessageDateTime;
	}

	function url(tlUrl) {
		if (canl(tlUrl)) {
			this._url = tlUrl;
		}
		return this._url;
	}

	function searchCondition(tlSearchCondition) {
		if (can(tlSearchCondition)) {
			this._searchCondition = tlSearchCondition;
		}
		return this._searchCondition;
	}

	function createParameters() {
		var cond = this.searchCondition();
		if (can(this.latestMessageDateTime())) {
			cond.futureThan(this.latestMessageDateTime());
		}
		var condJSON = cond.toJSON();
		return condJSON;
	}

	function createParametersReadMore() {
		var cond = this.searchCondition();
		if (can(this.oldestMessageDateTime())) {
			cond.pastThan(this.oldestMessageDateTime());
		}
		var condJSON = cond.toJSON();
		return condJSON;
	}

	function init() {
		var method = 'GET';
		var data = this.createParameters();
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var that = this;
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] > 0) {
						for (var itemIndex = tlResult['count'] - 1; itemIndex >= 0; itemIndex--) {
							$("#" + this.id()).prepend(this.createTimelineItem(tlResult['results'][itemIndex]));

							(function(id) {
								var $message = $("#" + id + ' > div.timeline-item-wrapper:first .timeline-item-message');
								$message.html(autolink($message.html()));
								$message.find('a').on('click', function(e) {
									e.stopPropagation();
								});
							})(this.id())

							$("#" + this.id() + ' > div.timeline-item-wrapper:first').on('click', function(e) {
								e.stopPropagation();
								var selfMessageId = $(this).find('input[name=message-id]').val();
								var conversationId = that.id() + '_conversation';
								var conversation = createAtmosConversation(conversationId, selfMessageId);
								that._conversation = conversation;

								var closeHandler = function(conversationPanel) {
									var t = conversationPanel;
									t.hide("normal", function() { t.close(); that._conversation = undefined; });
									that.show("normal");
								}
								conversation.init($("#" + that.rootId()), closeHandler);
								that.hide("normal");
								conversation.show("normal");
							});
							$("#" + this.id() + ' > div.timeline-item-wrapper:first a.reaction').on('click', function(e) {
								e.stopPropagation();
								var targetLink = e.currentTarget;
								var $base = $(targetLink).parent().parent();
								var targetMessageId = $base.find('input[name=message-id]').val();
								var targetMessageBody = $base.find('input[name=message-body]').val();
								var reactionType = $(targetLink).attr('reaction-type');
								atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody);
							});
							$("#" + this.id() + ' > div.timeline-item-wrapper:first a.reply').on('click', function(e) {
								e.stopPropagation();
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

								var replyType = $(targetLink).attr('reply-type');
								var defaultMessage = '';
								if (replyType === 'quote') {
									defaultMessage = targetMessageBody;
								}
								atmos.showMessageSenderPanel(defaultMessage, targetMessageId, targetMessageBody, addresses);
							});
							$("#" + this.id() + ' > div.timeline-item-wrapper:first a.remove').on('click', function(e) {
								e.stopPropagation();
								var targetLink = e.currentTarget;
								var $base = $(targetLink).parent().parent();
								var targetMessageId = $base.find('input[name=message-id]').val();
								var targetMessageBody = $base.find('input[name=message-body]').val();
								atmos.showMessageRemoveDialog(targetMessageId, targetMessageBody);
							});
						}
						this.latestMessageDateTime(tlResult['latest_created_at']);
						this.oldestMessageDateTime(tlResult['oldest_created_at']);

						var newItems = $("#" + this.id() + ' > div.new-item');
						var delay = 0;
						var delayDelta = 60;
						var animationClasses = 'magictime swashIn';
						var newItemsLength = newItems.length;
						for (var i = 0; i < newItemsLength; i++) {
							var $targetNewItem = $(newItems[i]);
							$targetNewItem.removeClass('new-item');
							(function(){
								var delayms = delay;
								var $item = $targetNewItem;
								setTimeout(
									function() {
										$item.addClass(animationClasses);
										$item.show();
									},
									delayms
								);
							})();
							(function(){
								var delayms = delay + 1500;
								var $item = $targetNewItem;
								setTimeout(
									function() {
										$item.removeClass(animationClasses);
									},
									delayms
								);
							})();
							delay += delayDelta;
						}

						if (tlResult['count'] === this.searchCondition().count()) {
							$("#" + this.id()).append(Hogan.compile($("#tmpl-timeline-read-more").text()).render({}));
							var $readMore = $("#" + that.id() + " .timeline-read-more");
							$readMore.find("a").on('click', function(e) { that.readMore(); });
							setTimeout(
								function() {
									$readMore.show("normal");
								},
								delay
							);
						}

						this.setScrollbar();
					}
				}
			},
			this
		);
		atmos.sendRequest(
			this.url(),
			method,
			data,
			successCallback
		);
	}

	function readMore() {
		var $readMore = $("#" + this.id() + " .timeline-read-more").hide();
		var data = this.createParametersReadMore();
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var that = this;
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] > 0) {
						for (var itemIndex = 0; itemIndex < tlResult['count']; itemIndex++) {
							$readMore.before(that.createTimelineItem(tlResult['results'][itemIndex]));

							(function(id) {
								var $message = $("#" + id + ' > div.timeline-item-wrapper:last .timeline-item-message');
								$message.html(autolink($message.html()));
								$message.find('a').on('click', function(e) {
									e.stopPropagation();
								});
							})(this.id())

							$("#" + this.id() + ' > div.timeline-item-wrapper:last').on('click', function(e) {
								e.stopPropagation();
								var selfMessageId = $(this).find('input[name=message-id]').val();
								var conversationId = that.id() + '_conversation';
								var conversation = createAtmosConversation(conversationId, selfMessageId);
								that._conversation = conversation;

								var closeHandler = function(conversationPanel) {
									var t = conversationPanel;
									t.hide("normal", function() { t.close(); that._conversation = undefined; });
									that.show("normal");
								}
								conversation.init($("#" + that.rootId()), closeHandler);
								that.hide("normal");
								conversation.show("normal");
							});
							$("#" + this.id() + ' > div.timeline-item-wrapper:last a.reaction').on('click', function(e) {
								e.stopPropagation();
								var targetLink = e.currentTarget;
								var $base = $(targetLink).parent().parent();
								var targetMessageId = $base.find('input[name=message-id]').val();
								var targetMessageBody = $base.find('input[name=message-body]').val();
								var reactionType = $(targetLink).attr('reaction-type');
								atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody);
							});
							$("#" + this.id() + ' > div.timeline-item-wrapper:last a.reply').on('click', function(e) {
								e.stopPropagation();
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

								var replyType = $(targetLink).attr('reply-type');
								var defaultMessage = '';
								if (replyType === 'quote') {
									defaultMessage = targetMessageBody;
								}
								atmos.showMessageSenderPanel(defaultMessage, targetMessageId, targetMessageBody, addresses);
							});
							$("#" + this.id() + ' > div.timeline-item-wrapper:last a.remove').on('click', function(e) {
								e.stopPropagation();
								var targetLink = e.currentTarget;
								var $base = $(targetLink).parent().parent();
								var targetMessageId = $base.find('input[name=message-id]').val();
								var targetMessageBody = $base.find('input[name=message-body]').val();
								atmos.showMessageRemoveDialog(targetMessageId, targetMessageBody);
							});
						}
						this.latestMessageDateTime(tlResult['latest_created_at']);
						this.oldestMessageDateTime(tlResult['oldest_created_at']);

						var newItems = $("#" + this.id() + ' > div.new-item');
						var delay = 0;
						var delayDelta = 60;
						var animationClasses = 'magictime swashIn';
						var newItemsLength = newItems.length;
						for (var i = 0; i < newItemsLength; i++) {
							var $targetNewItem = $(newItems[i]);
							$targetNewItem.removeClass('new-item');
							(function(){
								var delayms = delay;
								var $item = $targetNewItem;
								setTimeout(
									function() {
										$item.addClass(animationClasses);
										$item.show();
									},
									delayms
								);
							})();
							(function(){
								var delayms = delay + 1500;
								var $item = $targetNewItem;
								setTimeout(
									function() {
										$item.removeClass(animationClasses);
									},
									delayms
								);
							})();
							delay += delayDelta;
						}

						if (tlResult['count'] === this.searchCondition().count()) {
							setTimeout(
								function() {
									$readMore.show("normal");
								},
								delay
							)
						}
						this.setScrollbar();
					}
				}
			},
			this
		);
		atmos.sendRequest(
			this.url(),
			'GET',
			data,
			successCallback
		);
	}

	function show(speed, callback) {
		$("#" + this.rootId()).show(speed, callback);
	}

	function hide(speed, callback) {
		$("#" + this.rootId()).hide(speed, callback);
	}

	function createTimelineItem(msg) {
		var context = {};
		context["is-own-message"] = atmos.currentUserId() === msg['created_by'];
		context["timeline-item-message-id"] = msg['_id'];
		context["timeline-item-timestamp"] = utc2jstRelative(msg['created_at']);
		context["timeline-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"];
		context["timeline-item-username"] = msg["created_by"];
		context["timeline-item-message"] = msg["message"];
		var addresses = msg["addresses"];
		if (can(addresses)) {
			var addressUsers = addresses['users'];
			if (can(addressUsers)) {
				context["timeline-item-address-users"] = addressUsers.map(function(addressUser) { return '@' + addressUser; }).join(' ');
			}
			var addressGroups = addresses['groups'];
			if (can(addressGroups)) {
				context["timeline-item-address-groups"] = addressGroups.map(function(addressGroup) { return '$' + addressGroup; }).join(' ');
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
		return Hogan.compile($("#tmpl-timeline-item-wrapper").text()).render(context);
	}

	function updateTimelineItemReaction(msg) {
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
			var $targetItem = $(reactionTargetArticles[i]).parent();
			(function(){
				var delayms = delay;
				var $item = $targetItem;
				setTimeout(
					function() {
						$item.addClass(animationClasses);
					},
					delayms
				);
			})();
			(function(){
				var delayms = delay + 1500;
				var $item = $targetItem;
				setTimeout(
					function() {
						$item.removeClass(animationClasses);
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
						this.updateTimelineItemReaction(tlItem);
					}
				}
			},
			this
		);
		atmos.sendRequest(
			url,
			method,
			data,
			successCallback
		);

		if (can(this._conversation)) {
			this._conversation.refreshMessage(messageId);
		}
	}

	function removeMessage(messageId) {
		var msgId = messageId;
		var removedMessageArticle = $("#" + this.id() + " article.msg_" + msgId);
		var delay = 0;
		var delayDelta = 60;
		var animationClasses = 'magictime holeOut';
		for (var i=removedMessageArticle.length - 1; i >= 0; i--) {
			var $targetItem = $(removedMessageArticle[i]).parent();
			(function(){
				var delayms = delay;
				var $item = $targetItem;
				setTimeout(
					function() {
						$item.addClass(animationClasses);
					},
					delayms
				);
			})();
			(function(){
				var delayms = delay + 1050;
				var $item = $targetItem;
				setTimeout(
					function() {
						$item.remove();
					},
					delayms
				);
			})();
			delay += delayDelta;
		}
		if (can(this._conversation)) {
			this._conversation.removeMessage(messageId);
		}
	}

	function setScrollbar() {
		if (this.scrollbarWasSet === false) {
			$('#' + this.id()).parent().perfectScrollbar(atmos.perfectScrollbarSetting);
			this.scrollbarWasSet = true;
		}
	}

	createAtmosTimeline = function(id, name, description, url, searchCondition) {
		return new AtmosTimeline(id, name, description, url, searchCondition);
	}

})();
