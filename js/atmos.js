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
		sendPrivate : sendPrivate,
		responseToMessage : responseToMessage,
		getTimelines : getTimelines,
		addTimeline : addTimeline,
		showLoginDialog : showLoginDialog,
		showLogoutDialog : showLogoutDialog,
		showPasswordChangeDialog : showPasswordChangeDialog,
		showAvatorChangeDialog : showAvatorChangeDialog,
		showMessageSenderDialog : showMessageSenderDialog,
		showPrivateMessageSenderDialog : showPrivateMessageSenderDialog,
		showResponseDialog : showResponseDialog,
		createTimelineItem : createTimelineItem,
		init : init,
		initSockJS : initSockJS,
		processServerNotification : processServerNotification,
		refreshTimelines : refreshTimelines,
		allUserIds : allUserIds,
		allGroupIds : allGroupIds,
		clearCurrentInfo : clearCurrentInfo,
	}

	function atmosSessionId(id) {
		if (can(id) && id.length > 0) {
			this._atmosAuthSessionId = id;
		}
		return this._atmosAuthSessionId;
	}

	function currentUserId(userId) {
		if (can(userId) && userId.length > 0) {
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
		var url = this.createUrl('/auth/login');
		var method = 'POST';
		var data = {
			user_id : id,
			password : pw
		}
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
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callback.fire(callbackResult);
				}
				console.log(errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// determine who am I
	// callback(when successed): { "status":"ok", "user_id":user id of current user }
	// callback(when failed): { "status":"error" }
	function whoami(callback) {
		var url = this.createUrl('/auth/whoami');
		var method = 'GET';
		var data = {};
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var whoamiResult = JSON.parse(res);
				var resultStatus = 'ng';
				var reusltUserId = null;
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
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callback.fire(callbackResult);
				}
				console.log(errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// logout
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function logout() {
		var url = this.createUrl('/auth/logout');
		var method = 'GET';
		var data = {};
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
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// change password
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function changePassword(currentPassword, newPassword, callback) {
		var url = this.createUrl('/user/change_password');
		var method = 'POST';
		var data = {
			current_user_password : currentPassword,
			new_user_password : newPassword,
		}
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var loginResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (loginResult['status'] === 'ok') {
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
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callbackResult['message'] = errorThrown;
					console.dir(errorThrown);
					callback.fire(callbackResult);
				}
				console.log(errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// obtain all user id(s)
	// callback(when successed): { "status":"ok", "user_id":user id of current user }
	// callback(when failed): { "status":"error" }
	function loadAllUserIds(callback) {
		var url = this.createUrl('/user/list');
		var method = 'GET';
		var data = {};
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var result = JSON.parse(res);
				var resultStatus = 'ng';
				if (result['status'] === 'ok') {
					resultStatus = 'ok';
					var userCount = result['count'];
					var userIds = [];
					for (var i=0; i<userCount; i++) {
						var userInfo = result['results'][i];
						userIds.push(userInfo['user_id']);
					}
					this.allUserIds(userIds);
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callback.fire(callbackResult);
				}
				console.log(errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// obtain all user id(s)
	// callback(when successed): { "status":"ok", "user_id":user id of current user }
	// callback(when failed): { "status":"error" }
	function loadAllGroupIds(callback) {
		var url = this.createUrl('/group/list');
		var method = 'GET';
		var data = {};
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var result = JSON.parse(res);
				var resultStatus = 'ng';
				if (result['status'] === 'ok') {
					resultStatus = 'ok';
					var groupCount = result['count'];
					var groupIds = [];
					for (var i=0; i<groupCount; i++) {
						var groupInfo = result['results'][i];
						groupIds.push(groupInfo['group_id']);
					}
					this.allGroupIds(groupIds);
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callback.fire(callbackResult);
				}
				console.log(errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// send message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function sendMessage(message, messageType, replyToMessageId, callback) {
		var url = this.createUrl('/messages/send');
		var method = 'POST';
		var data = {
			message : message,
			message_type : messageType,
			reply_to : replyToMessageId
		}
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
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callback.fire(callbackResult);
				}
				$.jGrowl('Message was not sent. ' + errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// send message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function sendPrivate(addressUserId, message, callback) {
		var url = this.createUrl('/private/send');
		var method = 'POST';
		var data = {
			to_user_id : addressUserId,
			message : message,
		}
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
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callback.fire(callbackResult);
				}
				$.jGrowl('Private Message was not sent. ' + errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
	}

	// response to message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function responseToMessage(targetMessageId, reactionType, callback) {
		var url = this.createUrl('/messages/response');
		var method = 'POST';
		var data = {
			target_id : targetMessageId,
			action : reactionType
		}
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					$.jGrowl('Responding to Message was succeeded.');
				}
				else {
					$.jGrowl('Responding to Message was failed. ' + errorThrown);
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = 'error';
					callback.fire(callbackResult);
				}
				$.jGrowl('Responding to Message was failed. ' + errorThrown);
			},
			this
		);
		this.sendRequest(url, method, data, successCallback, failureCallback);
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
		var dialogMsg = can(message) ? message : '';
		var dialog = createAtmosDialog(
			'Atmosphere',
			[ dialogMsg ],
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
		);
		dialog.show();
	}

	function showLogoutDialog(message, defaultUserId) {
		var dialog = createAtmosDialog(
			'Logout?',
			[ ],
			[ ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					atmos.logout();
				}
			}
		);
		dialog.show();
	}

	function showPasswordChangeDialog(message) {
		var dialogMsg = can(message) ? message : '';
		var dialog = createAtmosDialog(
			'Change password',
			[ dialogMsg ],
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
		);
		dialog.show();
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
		);
		dialog.show();
	}

	function showMessageSenderDialog(defaultMessage, replyToMessageId, originalMessageBody) {
		var msgs = [];
		if (can(replyToMessageId)) {
			msgs.push('Reply to');
			msgs.push('');
			msgs.push(originalMessageBody);
		}
		var dialog = createAtmosDialog(
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
		);
		dialog.show();
	}

	function showPrivateMessageSenderDialog(addressUserId, defaultMessage, replyToMessageId, originalMessageBody) {
		var msgs = [];
		if (can(replyToMessageId)) {
			msgs.push('Reply to');
			msgs.push('');
			msgs.push(originalMessageBody);
		}
		var dialog = createAtmosDialog(
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
		);
		dialog.show();
	}

	function showResponseDialog(targetMessageId, reactionType, messageBody) {
		var dialog = createAtmosDialog(
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
		);
		dialog.show();
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
				var pValue = dataJSON[pName];
				query += pName + '=' + pValue;
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
	        //window.console.debug(errorThrown);
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
		var tlGlobal = createAtmosTimeline('tl_global_timeline', 'Global', 'all messages', this.createUrl('/messages/global_timeline'), scGlobal);
		this.addTimeline(tlGlobal);

		var scMy = createAtmosSearchCondition();
		var tlMy = createAtmosTimeline('tl_my_timeline', 'My', 'The messages that my speakers says.', this.createUrl('/messages/focused_timeline'), scMy);
		this.addTimeline(tlMy);

		var scTalk = createAtmosSearchCondition();
		var tlTalk = createAtmosTimeline('tl_talk_timeline', 'Talk', '', this.createUrl('/messages/talk_timeline'), scTalk);
		this.addTimeline(tlTalk);

		var scAnnounce = createAtmosSearchCondition();
		var tlAnnounce = createAtmosTimeline('tl_announce_timeline', 'Announce', '', this.createUrl('/messages/announce_timeline'), scAnnounce);
		this.addTimeline(tlAnnounce);

		var scMonolog = createAtmosSearchCondition();
		var tlMonolog = createAtmosTimeline('tl_monolog_timeline', 'Monolog', '', this.createUrl('/messages/monolog_timeline'), scMonolog);
		this.addTimeline(tlMonolog);

		var scPrivate = createAtmosSearchCondition();
		var tlPrivate = createAtmosTimeline('tl_private_timeline', 'Private', '', this.createUrl('/private/timeline'), scPrivate);
		this.addTimeline(tlPrivate);
	}

	function initSockJS() {
		this._sockjs.end();
		var cb = new CallbackInfo(
			this.processServerNotification,
			this
		);
		this._sockjs.addNotificationReceiver(cb);
		this._sockjs.start(this.atmosSessionId());
	}

	function processServerNotification(msgJSON) {
		if (msgJSON['action'] === 'sendResponse') {
			var targetMsgId = msgJSON['info']['target_msg_id'];
			this.getTimelines().forEach(function(tl) { tl.refreshMessage(targetMsgId); });
		}
		else if (msgJSON['action'] === 'sendMessage') {
			this.refreshTimelines();
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
			this._allUserIds = [];
			for (var i=0; i<ids.length; i++) {
				this._allUserIds.push(ids[i]);
			}
		}
		return this._allUserIds;
	}

	function allGroupIds(ids) {
		if (can(ids)) {
			this._allGroupIds = [];
			for (var i=0; i<ids.length; i++) {
				this._allGroupIds.push(ids[i]);
			}
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

	atmos = new Atmos();
	$(document).ready(function() {
		atmos.init();
	});
})();

