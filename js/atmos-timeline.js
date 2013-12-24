var AtmosTimeline = (function() {
	function AtmosTimeline(id, name, description, url, searchCondition, callbackAfterConversation) {
		this.id(id);
		this.rootId(id + '-root');
		this.name(name);
		this.description(description);
		this.url(url);
		this.searchCondition(searchCondition);
		this._callbackAfterConversation = callbackAfterConversation;
		this._searchUrl = atmos.createUrl('/messages/search');
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
		enableChangePositionLeft : enableChangePositionLeft,
		disableChangePositionLeft : disableChangePositionLeft,
		enableChangePositionRight : enableChangePositionRight,
		disableChangePositionRight : disableChangePositionRight,
		createTimelineItem : createTimelineItem,
		readMore : readMore,
		updateTimelineItemReaction : updateTimelineItemReaction,
		refreshMessage : refreshMessage,
		removeMessage : removeMessage,
		setScrollbar : setScrollbar,
		selector : selector,
		applyItemEvents : applyItemEvents,
	}

	function id(tlId) {
		if (canl(tlId)) {
			this._id = tlId;
			this._thisSelector = '#' + this._id;
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
		var cond = $.extend(true, {}, this.searchCondition());
		if (can(this.latestMessageDateTime())) {
			cond.futureThan(this.latestMessageDateTime());
		}
		var condJSON = cond.toJSON();
		return condJSON;
	}

	function createParametersReadMore() {
		var cond = $.extend(true, {}, this.searchCondition());
		if (can(this.oldestMessageDateTime())) {
			cond.pastThan(this.oldestMessageDateTime());
		}
		var condJSON = cond.toJSON();
		return condJSON;
	}

	function init() {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var that = this;
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] > 0) {
						tlResult['results'].reverse().forEach(function(msg, i, a) {
							$(that.selector()).prepend(that.createTimelineItem(msg));

							createHyperLink($(that.selector(' > div:first .timeline-item-message')));

							that.applyItemEvents($(that.selector('> div:first')));
						});

						this.latestMessageDateTime(tlResult['latest_created_at']);
						this.oldestMessageDateTime(tlResult['oldest_created_at']);

						var totalDelay = showNewItems($(this.selector('> div.new-item')));

						if (tlResult['count'] === this.searchCondition().count()) {
							var $readMore = $(this.selector(".timeline-read-more"));
							if ($readMore.length === 0) {
								$(this.selector()).append(Hogan.compile($("#tmpl-timeline-read-more").text()).render({}));
								$readMore = $(this.selector(".timeline-read-more"));
								$readMore.find("a").on('click', function(e) { that.readMore(); });
								applyMagicEffect($readMore, 'magictime swashIn', totalDelay);
							}
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
			this.createParameters(),
			successCallback
		);
	}

	function readMore() {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var that = this;
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] > 0) {
						var $readMore = $(that.selector(".timeline-read-more")).hide();
						tlResult['results'].forEach(function(msg, i, a) {
							$readMore.before(that.createTimelineItem(msg));

							createHyperLink($(that.selector('> div.timeline-item-wrapper:last .timeline-item-message')));

							that.applyItemEvents($(that.selector('> div.timeline-item-wrapper:last')));
						});

						this.latestMessageDateTime(tlResult['latest_created_at']);
						this.oldestMessageDateTime(tlResult['oldest_created_at']);

						var totalDelay = showNewItems($(this.selector('> div.new-item')));

						if (tlResult['count'] === this.searchCondition().count()) {
							applyMagicEffect($readMore, 'magictime swashIn', totalDelay);
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
			this.createParametersReadMore(),
			successCallback
		);
	}

	function show(speed, callback) {
		$("#" + this.rootId()).show(speed, callback);
	}

	function hide(speed, callback) {
		$("#" + this.rootId()).hide(speed, callback);
	}

	function enableChangePositionLeft() {
		$("#" + this.rootId() + " .header-control .move-left a").show();
	}

	function disableChangePositionLeft() {
		$("#" + this.rootId() + " .header-control .move-left a").hide();
	}

	function enableChangePositionRight() {
		$("#" + this.rootId() + " .header-control .move-right a").show();
	} 

	function disableChangePositionRight() {
		$("#" + this.rootId() + " .header-control .move-right a").hide();
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
		var that = this;
		var msgId = msg['_id'];
		var responses = msg['responses'];
		Object.keys(responses).forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			$(that.selector("article.msg_" + msgId + " div.reaction-panel a.reaction-count[reaction-type=" + resType + "]")).text(responderUserIds.length);
		});
		var $reactionTargetArticles = $(this.selector("article.msg_" + msgId));
		var delay = 0;
		$($reactionTargetArticles.get().reverse()).each(function(index) {
			var $targetItem = $(this).parent();
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
						var tlItem = tlResult['results'][0];
						this.updateTimelineItemReaction(tlItem);
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

		if (can(this._conversation)) {
			this._conversation.refreshMessage(messageId);
		}
	}

	function removeMessage(messageId) {
		var $removedMessageArticle = $(this.selector("article.msg_" + messageId));
		var delay = 0;
		$($removedMessageArticle.get().reverse()).each(function(index) {
			applyMagicEffect($(this).parent(), 'magictime holeOut', delay, function($target) { $target.remove(); });
			delay += 60;
		});
		if (can(this._conversation)) {
			this._conversation.removeMessage(messageId);
		}
	}

	function setScrollbar() {
		if (this.scrollbarWasSet === false) {
			$(this.selector()).parent().perfectScrollbar(atmos.perfectScrollbarSetting);
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

	function createHyperLink($message) {
		$message.html(autolink($message.html()));
		$message.find('a').on('click', function(e) {
			e.stopPropagation();
		});
	}

	function applyItemEvents($target) {
		var that = this;
		$target.find('div.timeline-item-user').on('click', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($target.find('div.timeline-item-username').text());
		});
		$target.find('a.reaction').on('click', function(e) {
			e.stopPropagation();
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			var reactionType = $(targetLink).attr('reaction-type');
			atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody, false);
		});
		$target.find('a.reply').on('click', function(e) {
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
			addresses = addresses.filter(function(v) { return v !== '@' + atmos.currentUserId(); });

			var replyType = $(targetLink).attr('reply-type');
			var defaultMessage = '';
			if (replyType === 'quote') {
				defaultMessage = targetMessageBody;
			}
			atmos.showMessageSenderPanel(defaultMessage, targetMessageId, targetMessageBody, addresses, false);
		});
		$target.find('a.show-conversation').on('click', function(e) {
			e.stopPropagation();
			var targetMessageId = $(e.currentTarget).parent().parent().find('input[name=message-id]').val();
			that._conversation = new AtmosConversation(that.id() + '_conversation', targetMessageId);

			var closeHandler = function(conversationPanel) {
				var t = conversationPanel;
				t.hide("normal", function() { t.close(); that._conversation = undefined; });
				if (canl(that._callbackAfterConversation)) {
					that.show("normal", that._callbackAfterConversation);
				}
				else {
					that.show("normal");
				}
			}
			that._conversation.init($("#" + that.rootId()), closeHandler);
			if (canl(that._callbackAfterConversation)) {
				that.hide("normal", that._callbackAfterConversation);
			}
			else {
				that.hide("normal");
			}
			that._conversation.show("normal");
		});
		$target.find('a.remove').on('click', function(e) {
			e.stopPropagation();
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			atmos.showMessageRemoveDialog(targetMessageId, targetMessageBody, false);
		});
	}

	function showNewItems($newItems) {
		var delay = 0;
		$newItems.each(function(index) {
			var $targetNewItem = $(this);
			$targetNewItem.removeClass('new-item');
			applyMagicEffect($targetNewItem, 'magictime swashIn', delay);
			delay += 60;
		});

		return delay;
	}

	return AtmosTimeline;
})();
