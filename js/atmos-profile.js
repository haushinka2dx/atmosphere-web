var AtmosProfile = (function() {
	function AtmosProfile(userId) {
		this.id(uuid());
		this.userId(userId);
		this._searchUrl = atmos.createUrl('/messages/search');
		this._recentlyMessagesCount = 20;
	};

	AtmosProfile.prototype.id = function(profId) {
		if (canl(profId)) {
			this._id = profId;
			this._thisSelector = '#' + this._id;
		}
		return this._id;
	};

	AtmosProfile.prototype.userId = function(profUserId) {
		if (canl(profUserId)) {
			this._userId = profUserId;
			//TODO: 本来は /users/profile?user_id=hoge というようにプロファイルの詳細を取るAPIを使うべきだがAPIがないので代用
			this.urlGetProfile(atmos.createUrl('/user/list'));
		}
		return this._userId;
	};

	AtmosProfile.prototype.urlGetProfile = function(url) {
		if (canl(url)) {
			this._urlGetProfile = url;
		}
		return this._urlGetProfile;
	};

	AtmosProfile.prototype.createParameters = function() {
		var cond = createAtmosSearchCondition();
		cond.createdBy(this.userId());
		cond.count(this._recentlyMessagesCount);
		return cond.toJSON();
	}

	AtmosProfile.prototype.init = function(callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var that = this;
				var result = JSON.parse(res);
				var resultStatus;
				if (result['status'] === 'ok') {
					resultStatus = 'ok';
					if (result['results'].some(function(u) { return u['user_id'] === that.userId(); })) {
						$('body').append(that.createDialog());

						that.applyDialogEvents();

						that.loadRecentMessages();
					}
					else {
						resultStatus = 'ng';
					}
				}
				else {
					resultStatus = 'ng';
				}
				
				if (can(callback)) {
					callback.fire({status:resultStatus});
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					callback.fire({status:'ng'});
				}
			},
			this
		);
		atmos.sendRequest(
			this.urlGetProfile(),
			'GET',
			{},
			successCallback,
			failureCallback
		);
	}

	AtmosProfile.prototype.loadRecentMessages = function() {
		var that = this;
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] > 0) {
						tlResult['results'].reverse().forEach(function(msg, i, a) {
							var $timeline = $(that.selector('.profile .profile-main div.timeline'));
							$timeline.prepend(that.createTimelineItem(msg, i > 0));

							createHyperLink($timeline.find('article.timeline-item:first div.message'));

							that.applyItemEvents($timeline.find('article.timeline-item:first'));
						});

						var totalDelay = showNewItems($(that.selector('.profile .profile-main div.timeline article.new-item')));

						$(that.selector('.profile .profile-main div.timeline')).perfectScrollbar(atmos.perfectScrollbarSetting);
					}
				}
			},
			that
		);
		atmos.sendRequest(
			this._searchUrl,
			'GET',
			this.createParameters(),
			successCallback
		);
	};

	AtmosProfile.prototype.show = function(speed, callback) {
		$(this.selector()).show(speed, callback);
	}

	AtmosProfile.prototype.hide = function(speed, callback) {
		$(this.selector()).hide(speed, callback);
	}

	AtmosProfile.prototype.close = function() {
		$(this.selector()).remove();
	}

	AtmosProfile.prototype.hideAndClose = function(speed) {
		this.hide(speed, this.close.bind(this));
	}

	AtmosProfile.prototype.createDialog = function(profileInfo) {
		var context = {};
		context["profile-dialog-id"] = this.id();
		context["profile-avator-image-url"] = atmos.createUrl('/user/avator?user_id=' + this.userId());
		context["profile-username"] = this.userId();
		context["profile-introduction"] = '';
		return Hogan.compile($("#tmpl-profile-dialog").text()).render(context);
	};

	AtmosProfile.prototype.createTimelineItem = function(msg, hasNextMessage) {
		var context = {};
		context["is-own-message"] = atmos.currentUserId() === msg['created_by'];
		context["has-next-message"] = hasNextMessage;
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
		return Hogan.compile($("#tmpl-profile-dialog-timeline-item").text()).render(context);
	}

	AtmosProfile.prototype.updateTimelineItemReaction = function(msg) {
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
			applyMagicEffect($(this), 'magictime tada', delay);
			delay += 60;
		});
	};

	AtmosProfile.prototype.refreshMessage = function(messageId) {
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
	};

	AtmosProfile.prototype.removeMessage = function(messageId) {
		var $removedMessageArticle = $(this.selector("article.msg_" + messageId));
		var delay = 0;
		$($removedMessageArticle.get().reverse()).each(function(index) {
			applyMagicEffect($(this), 'magictime holeOut', delay, function($target) { $target.remove(); });
			applyMagicEffect($(this).next('div.timeline-item-separator'), 'magictime holeOut', delay, function($target) { $target.remove(); });
			delay += 60;
		});
	}

	AtmosProfile.prototype.selector = function(descendants) {
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

	AtmosProfile.prototype.applyDialogEvents = function() {
		var that = this;
		$(that.selector()).on('click', function(e) {
			e.stopPropagation();
			that.hideAndClose('fast');
		});
		$(that.selector('.profile')).on('click', function(e) {
			e.stopPropagation();
			// do nothing
			// これがないとどこをクリックしても閉じてしまうので入れている
		});
		$(that.selector('a.close-button')).on('click', function(e) {
			e.stopPropagation();
			that.hideAndClose('fast');
		});
		$(that.selector('.profile header div.action-panel div.action.send-message')).on('click', function(e) {
			e.stopPropagation();
			atmos.showMessageSenderPanel('@' + that.userId() + ' ', '', '', ['@' + that.userId()], false);
			that.hideAndClose('fast');
		});
		$(that.selector('.profile header div.action-panel div.action.send-private')).on('click', function(e) {
			e.stopPropagation();
			atmos.showMessageSenderPanel('', '', '', ['@' + that.userId()], true);
			that.hideAndClose('fast');
		});
	};

	AtmosProfile.prototype.applyItemEvents = function($target) {
		var that = this;
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
			that.hideAndClose('fast');
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

	return AtmosProfile;
})();
