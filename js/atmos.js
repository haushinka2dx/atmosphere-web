var atmos = null;

(function() {
	function Atmos() {
		this.baseUrl = '/atmos';
		this._timelines = {};
		this._allUserIds = [];
		this._allGroupIds = [];
		this._sockjs = createAtmosSockJS();
	};
	Atmos.prototype = {
		atmosSessionId : atmosSessionId,
		currentUserId : currentUserId,
		createUrl : createUrl,
		sendRequest : sendRequest,
		login : login,
		whoami : whoami,
		logout : logout,
		changePassword : changePassword,
		loadAllUserIds : loadAllUserIds,
		loadAllGroupIds : loadAllGroupIds,
		sendMessage : sendMessage,
		removeMessage : removeMessage,
		sendPrivate : sendPrivate,
		responseToMessage : responseToMessage,
		getTimelines : getTimelines,
		addTimeline : addTimeline,
		showLoginDialog : showLoginDialog,
		showLogoutDialog : showLogoutDialog,
		showPasswordChangeDialog : showPasswordChangeDialog,
		showAvatorChangeDialog : showAvatorChangeDialog,
		showMessageSenderDialog : showMessageSenderDialog,
		showMessageRemoveDialog : showMessageRemoveDialog,
		showPrivateMessageSenderDialog : showPrivateMessageSenderDialog,
		showResponseDialog : showResponseDialog,
		showMessageSenderPanel : showMessageSenderPanel,
		createTimelineItem : createTimelineItem,
		init : init,
		initSockJS : initSockJS,
		initScrollbars : initScrollbars,
		processServerNotification : processServerNotification,
		refreshTimelines : refreshTimelines,
		allUserIds : allUserIds,
		allGroupIds : allGroupIds,
		clearCurrentInfo : clearCurrentInfo,
		perfectScrollbarSetting : { wheelSpeed: 70, minScrollbarLength: 100 },
		applyAutoComplete : applyAutoComplete,
	}

	function atmosSessionId(id) {
		if (canl(id)) {
			this._atmosAuthSessionId = id;
		}
		return this._atmosAuthSessionId;
	}

	function currentUserId(userId) {
		if (canl(userId)) {
			this._atmosCurrentUserId = userId;
		}
		return this._atmosCurrentUserId;
	}

	function createUrl(path) {
		return this.baseUrl + path;
	}

	// try login
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function login(id, pw, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var loginResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (loginResult['status'] === 'login successful') {
					resultStatus = 'ok';
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/auth/login'), 'POST', { user_id: id, password: pw }, successCallback, failureCallback);
	}

	// determine who am I
	// callback(when successed): { "status":"ok", "user_id":user id of current user }
	// callback(when failed): { "status":"error" }
	function whoami(callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var whoamiResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (whoamiResult['status'] === 'ok') {
					resultStatus = 'ok';
					resultUserId = whoamiResult['user_id'];
					this.currentUserId(resultUserId);
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callbackResult['user_id'] = resultUserId;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/auth/whoami'), 'GET', {}, successCallback, failureCallback);
	}

	// logout
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function logout() {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var logoutResult = JSON.parse(res);
				if (logoutResult['status'] === 'ok' || textStatus == 401) {
					this.clearCurrentInfo();
					this.init();
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
		this.sendRequest(this.createUrl('/auth/logout'), 'GET', {}, successCallback, failureCallback);
	}

	// change password
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function changePassword(currentPassword, newPassword, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var changedResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (changedResult['status'] === 'ok') {
					resultStatus = 'ok';
					$.jGrowl('Changing password was done successfully.');
				}
				else {
					$.jGrowl('Changing password was failed.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Changing password was failed.');
		this.sendRequest(this.createUrl('/user/change_password'), 'POST', { current_user_password : currentPassword, new_user_password : newPassword }, successCallback, failureCallback);
	}

	// obtain all user id(s)
	function loadAllUserIds(callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var result = JSON.parse(res);
				var resultStatus = 'ng';
				if (result['status'] === 'ok') {
					resultStatus = 'ok';
					this.allUserIds(result['results'].map(function(u) { return u['user_id']; }));
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/user/list'), 'GET', {}, successCallback, failureCallback);
	}

	// obtain all group id(s)
	function loadAllGroupIds(callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var result = JSON.parse(res);
				var resultStatus = 'ng';
				if (result['status'] === 'ok') {
					resultStatus = 'ok';
					this.allGroupIds(result['results'].map(function(g) { return g['group_id']; }));
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/group/list'), 'GET', {}, successCallback, failureCallback);
	}

	// send message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function sendMessage(message, messageType, replyToMessageId, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					$.jGrowl('Message was sent successfully.');
				}
				else {
					$.jGrowl('Message was not sent.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Message was not sent.');
		this.sendRequest(this.createUrl('/messages/send'), 'POST', { message : message, message_type : messageType, reply_to : replyToMessageId }, successCallback, failureCallback);
	}

	// remove  message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function removeMessage(targetMessageId, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					$.jGrowl('Message was removed successfully.');
				}
				else {
					$.jGrowl('Message was not removed. ' + sendResult['message']);
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Message was not removed.');
		this.sendRequest(this.createUrl('/messages/destroy'), 'POST', { _id: targetMessageId }, successCallback, failureCallback);
	}

	// send message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function sendPrivate(addressUserId, message, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					$.jGrowl('Private Message was sent successfully.');
				}
				else {
					$.jGrowl('Private Message was not sent.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Private Message was not sent.');
		this.sendRequest(this.createUrl('/private/send'), 'POST', { to_user_id : addressUserId, message : message }, successCallback, failureCallback);
	}

	// response to message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function responseToMessage(targetMessageId, reactionType, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					$.jGrowl('Responding to Message was succeeded.');
				}
				else {
					$.jGrowl('Responding to Message was failed.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Responding to Message was failed.');
		this.sendRequest(this.createUrl('/messages/response'), 'POST', { target_id : targetMessageId, action : reactionType }, successCallback, failureCallback);
	}

	function getTimelines() {
		var that = this;
		var tls = [];
		Object.keys(that._timelines).forEach(function(key) {
			tls.push(that._timelines[key]);
		});
		return tls;
	}

	function showLoginDialog(message, defaultUserId) {
		createAtmosDialog(
			'Atmosphere',
			[ can(message) ? message : ''],
			[ {"input-type":"text", "input-place-holder":"user id", "input-name":"user_id", "input-value":defaultUserId },
			  {"input-type":"password", "input-place-holder":"password", "input-name":"password", "input-value":"" } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var userId = result['inputs']['user_id'];
					var password = result['inputs']['password'];
					var postLogin = new CallbackInfo(
						function(res) {
							if (can(res) && res['status'] === 'ok') {
								this.init();
							}
							else {
								this.showLoginDialog('Login failed.  Please confirm user id or password, or both.', userId);
							}
						},
						atmos
					);
					atmos.login(userId, password, postLogin);
				}
			}
		).show();
	}

	function showLogoutDialog(message, defaultUserId) {
		createAtmosDialog(
			'Logout?',
			[ ],
			[ ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					atmos.logout();
				}
			}
		).show();
	}

	function showPasswordChangeDialog(message) {
		createAtmosDialog(
			'Change password',
			[ can(message) ? message : '' ],
			[ {"input-type":"password", "input-place-holder":"current password", "input-name":"current-password", "input-value":"" },
			  {"input-type":"password", "input-place-holder":"New password", "input-name":"new-password", "input-value":"" } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var currentPassword = result['inputs']['current-password'];
					var newPassword = result['inputs']['new-password'];
					var postChange = new CallbackInfo(
						function(res) {
							if (can(res) && res['status'] === 'ok') {
							}
							else {
								this.showPasswordChangeDialog('Changing password was failed. ' + res['message']);
							}
						},
						atmos
					);
					atmos.changePassword(currentPassword, newPassword, postChange);
				}
			}
		).show();
	}

	function showAvatorChangeDialog() {
		var that = this;
		var dialog = createAtmosDialog(
			'Change avator',
			[  ],
			[ {"input-type":"file", "input-place-holder":"", "input-name":"profileImage", "input-value":null } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var avatorFilePath = result['inputs']['profileImage'];
					if (can(avatorFilePath)) {
						$("#" + dialog.id()).upload(
							that.createUrl('/user/change_avator'),
							function(res) {
								$.jGrowl(res);
							},
							'json'
						);
					}
				}
			}
		)
		dialog.show();
	}

	function showMessageSenderDialog(defaultMessage, replyToMessageId, originalMessageBody, addresses) {
		var msgs = [];
		if (can(replyToMessageId)) {
			msgs.push('Reply to');
			msgs.push('');
			msgs.push(originalMessageBody);
		}
		if (!can(defaultMessage)) {
			defaultMessage = '';
		}
		if (can(addresses)) {
			for (var i=0; i<addresses.length; i++) {
				if (defaultMessage.indexOf(addresses[i]) === -1) {
					defaultMessage = addresses[i] + ' ' + defaultMessage;
				}
			}
		}
		createAtmosDialog(
			'Send Message',
			msgs,
			[ {"is-textarea":false, "input-type":"checkbox", "input-place-holder":"", "input-name":"message-type", "input-id":"inputted-message-type", "input-value":"monolog", "input-label-text":'send for myself only(others can not see)' },
			  {"is-textarea":true, "input-place-holder":"message", "input-name":"message", "input-id":"inputted-message", "input-value":defaultMessage } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var message = result['inputs']['message'];
					var messageType = result['inputs']['message-type'];
					atmos.sendMessage(message, messageType, replyToMessageId);
				}
			}
		).show();
	}

	function showMessageRemoveDialog(targetMessageId, targetMessageBody) {
		var msgs = [];
		msgs.push('Are you sure to remove message?');
		msgs.push('');
		msgs.push(targetMessageBody);
		createAtmosDialog(
			'Remove Message',
			msgs,
			[ ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					atmos.removeMessage(targetMessageId);
				}
			}
		).show();
	}

	function showPrivateMessageSenderDialog(addressUserId, defaultMessage, replyToMessageId, originalMessageBody) {
		var msgs = [];
		if (can(replyToMessageId)) {
			msgs.push('Reply to');
			msgs.push('');
			msgs.push(originalMessageBody);
		}
		createAtmosDialog(
			'Send Private',
			msgs,
			[ {"is-textarea":false, "input-type":"text", "input-place-holder":"user id of destination", "input-name":"address-user-id", "input-id":"inputted-address-user-id", "input-value":addressUserId },
			  {"is-textarea":true, "input-place-holder":"message", "input-name":"message", "input-id":"inputted-message", "input-value":defaultMessage } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var dstUserId = result['inputs']['address-user-id'];
					var message = result['inputs']['message'];
					atmos.sendPrivate(dstUserId, message);
				}
			}
		).show();
	}

	function showResponseDialog(targetMessageId, reactionType, messageBody) {
		createAtmosDialog(
			'Response',
			[ 'Are you sure to response "' + reactionType + '" ?',
			  '',
			  messageBody, ],
			[ ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					atmos.responseToMessage(targetMessageId, reactionType);
				}
			}
		).show();
	}

	function showMessageSenderPanel(defaultMessage, replyToMsgId, replyToMessage, addresses) {
		var that = this;
		if (!can(this._senderPanel)) {
			var id = 'sender-panel-' + uuid()
			this._senderPanel = createAtmosSenderPanel(id, $("div.contents-wrapper:first"), function() { that._senderPanel = undefined; });
		}
		this._senderPanel.setVariables(defaultMessage, replyToMsgId, replyToMessage, addresses);
		this._senderPanel.show("normal");
	}

	function sendRequest(url, method, dataJSON, successCallback, failureCallback) {
		var that = this;

		//set atmosphere-session-id to request header if has sessionId.
		var reqHeaders = {};
		if (can(that.atmosSessionId())) {
			reqHeaders['atmosphere-session-id'] = that.atmosSessionId();
		}

		var reqData = null;
		if (method === 'GET') {
			var query = '';
			Object.keys(dataJSON).forEach(function(pName, pIndex, pArray) {
				if (query.length > 0) {
					query += '&';
				}
				query += pName + '=' + dataJSON[pName];
			});
			reqData = query;
		}
		else {
			if (Object.keys(dataJSON).length > 0) {
				reqData = JSON.stringify(dataJSON);
			}
		}

	    var requestParams = {
	        url: url,
	        type: method,
//	        dataType: 'json',
	        dataType: 'text',
	        data: reqData,
			cache: false,
	        headers: reqHeaders
	    };
	
	    $.ajax(requestParams)
	    .done(function(data, textStatus, xhr){
	        var sessionId = xhr.getResponseHeader('atmosphere-session-id');
	        that.atmosSessionId(sessionId);

			if (can(successCallback)) {
				successCallback.fire(data, textStatus, xhr);
			}
	    })
	    .fail(function(xhr, textStatus, errorThrown){
			if (can(failureCallback)) {
				failureCallback.fire(xhr, textStatus, errorThrown);
			}
			else {
				console.log(errorThrown);
			}
	    })
	    .always(function(xhr, textStatus, errorThrown){
	        //window.console.debug(textStatus);
	    });
	}

	function createTimelineItem(msg) {
		var tmpl = Hogan.compile($("#tmpl-timeline-item-wrapper").text());
		var context = {};
		context["timeline-item-timestamp"] = utc2jst(msg['created_at']);
		context["timeline-item-avator-img-url"] = this.createUrl("/user/avator") + "?user_id=" + msg["created_by"];
		context["timeline-item-username"] = msg["created_by"];
		context["timeline-item-message"] = msg["message"];
		var reactions = [];
		var responses = msg['responses'];
		Object.keys(responses).sort().forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			var responseInfo = {};
			responseInfo['reaction-icon-class'] = "foundicon-" + resType;
			responseInfo['reaction-count'] = responderUserIds.length;
			reactions.push(responseInfo);
		});
		context["reactions"] = reactions;
		var generated = tmpl.render(context);
		return generated;
	}

	function init() {
		$('.timeline-items').empty();
		if (!can(atmosSessionId())) {
			var sessionIdInCookie = $.cookie('atmosphere-session-id');
			if (can(sessionIdInCookie)) {
				this.atmosSessionId(sessionIdInCookie);
				var whoamiCallback = new CallbackInfo(
					function(res) {
						if (res['status'] === 'ok') {
							this.loadAllUserIds();
							this.loadAllGroupIds();
							this.refreshTimelines();
							this.initSockJS();
						}
						else {
							this.showLoginDialog();
						}
					},
					this
				);
				this.whoami(whoamiCallback);
			}
			else {
				this.showLoginDialog();
			}
		}

		// defines timelines
		var scGlobal = createAtmosSearchCondition();
		scGlobal.count(10);
		var tlGlobal = createAtmosTimeline('tl_global_timeline', 'Global', 'all messages', this.createUrl('/messages/global_timeline'), scGlobal);
		this.addTimeline(tlGlobal);

		var scMy = createAtmosSearchCondition();
		scMy.count(20);
		var tlMy = createAtmosTimeline('tl_my_timeline', 'My', 'The messages that my speakers says.', this.createUrl('/messages/focused_timeline'), scMy);
		this.addTimeline(tlMy);

		var scTalk = createAtmosSearchCondition();
		scTalk.count(30);
		var tlTalk = createAtmosTimeline('tl_talk_timeline', 'Talk', '', this.createUrl('/messages/talk_timeline'), scTalk);
		this.addTimeline(tlTalk);

		var scAnnounce = createAtmosSearchCondition();
		scAnnounce.count(40);
		var tlAnnounce = createAtmosTimeline('tl_announce_timeline', 'Announce', '', this.createUrl('/messages/announce_timeline'), scAnnounce);
		this.addTimeline(tlAnnounce);

		var scMonolog = createAtmosSearchCondition();
		scMonolog.count(50);
		var tlMonolog = createAtmosTimeline('tl_monolog_timeline', 'Monolog', '', this.createUrl('/messages/monolog_timeline'), scMonolog);
		this.addTimeline(tlMonolog);

		var scPrivate = createAtmosSearchCondition();
		var tlPrivate = createAtmosTimeline('tl_private_timeline', 'Private', '', this.createUrl('/private/timeline'), scPrivate);
		this.addTimeline(tlPrivate);

		this.initScrollbars();
	}

	function initSockJS() {
		this._sockjs.end();
		this._sockjs.addNotificationReceiver(new CallbackInfo(this.processServerNotification, this));
		this._sockjs.start(this.atmosSessionId());
	}

	function initScrollbars() {
		$('.contents').perfectScrollbar(atmos.perfectScrollbarSetting);
		this.getTimelines().forEach(function(tl) { tl.setScrollbar(); });
	}

	function processServerNotification(msgJSON) {
		if (msgJSON['action'] === 'sendResponse') {
			var targetMsgId = msgJSON['info']['target_msg_id'];
			this.getTimelines().forEach(function(tl) { tl.refreshMessage(targetMsgId); });
		}
		else if (msgJSON['action'] === 'sendMessage') {
			this.refreshTimelines();
		}
		else if (msgJSON['action'] === 'removedMessage') {
			var removedMsgId = msgJSON['info']['_id'];
			this.getTimelines().forEach(function(tl) { tl.removeMessage(removedMsgId); });
		}
	}

	function addTimeline(timeline) {
		if (can(timeline)) {
			var addedKey = timeline.id();
			var alreadyExists = false;
			Object.keys(this._timelines).forEach(function(key, i, a) {
				if (key === addedKey) {
					alreadyExists = true;
					return;
				}
			});

			if (!alreadyExists) {
				this._timelines[addedKey] = timeline;
			}
		}
	}

	function refreshTimelines() {
		this.getTimelines().forEach(function(tl) { tl.init(); });
	}

	function allUserIds(ids) {
		if (can(ids)) {
			this._allUserIds = $.extend(true, [], ids);
		}
		return this._allUserIds;
	}

	function allGroupIds(ids) {
		if (can(ids)) {
			this._allGroupIds = $.extend(true, [], ids);
		}
		return this._allGroupIds;
	}

	function clearCurrentInfo() {
		$.removeCookie('atmosphere-session-id');
		this._atmosAuthSessionId = null;
		this._atmosCurrentUserId = null;
		this._timelines = [];
		this._allUserIds = [];
		this._allGroupIds = [];
	}

	function applyAutoComplete($target) {
		var that = this;
		if (!can(this._autoCompleteConfig)) {
			this._autoCompleteConfig = {
				// user id strategy
				user: {
					match: /(^|\s)@(\w*)$/,
					search: function (term, callback) {
						var regexp = new RegExp('^' + term);
						callback($.map(that.allUserIds(), function(userId) {
							return regexp.test(userId) ? userId : null;
						}));
					},
					template: function(value) {
						return '<img class="avator-mini" src="' + that.createUrl("/user/avator") + '?user_id=' + value + '" />' + value;
					},
					replace: function (value) {
						return '$1@' + value + ' ';
					},
					cache: false
				},

				// group id strategy
				group: {
					match: /(^|\s)\$(\w*)$/,
					search: function (term, callback) {
						var regexp = new RegExp('^' + term);
						callback($.map(that.allGroupIds(), function(groupId) {
							return regexp.test(groupId) ? groupId : null;
						}));
					},
					template: function(value) {
						return value;
					},
					replace: function (value) {
						return '$1$' + value + ' ';
					},
					cache: false
				}}
		};
		$target.textcomplete(this._autoCompleteConfig);
	}

	function createDefaultFailureCallback(caller, callback, hoverMessage) {
		return (function() {
			return new CallbackInfo(
				function(xhr, textStatus, errorThrown) {
					if (can(callback)) {
						var callbackResult = {};
						callbackResult['status'] = 'error';
						callback.fire(callbackResult);
					}
					console.log(errorThrown);
					if (canl(hoverMessage)) {
						$.jGrowl(hoverMessage);
					}
				},
				caller
			);
		})();
	}

	atmos = new Atmos();
	$(document).ready(function() {
		atmos.init();
	});
})();

