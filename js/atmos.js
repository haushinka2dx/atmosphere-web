var atmos = null;

(function() {
	function Atmos() {
		this.baseUrl = '/atmos';
	};
	Atmos.prototype = {
		atmosSessionId : atmosSessionId,
		currentUserId : currentUserId,
		createUrl : createUrl,
		sendRequest : sendRequest,
		login : login,
		whoami : whoami,
		getTimelines : getTimelines,
		createTimelineItem : createTimelineItem,
	}

	function atmosSessionId(id) {
		if (can(id) && id.length > 0) {
			this.atmosAuthSessionId = id;
		}
		return this.atmosAuthSessionId;
	}

	function currentUserId(userId) {
		if (can(userId) && userId.length > 0) {
			this.atmosCurrentUserId = userId;
		}
		return this.atmosCurrentUserId;
	}

	function createUrl(path) {
		return this.baseUrl + path;
	}

	// try login
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function login(id, pw, callback) {
		if (!can(callback)) {
			callback = new CallbackInfo(
				function(res) {
					console.log('[default] res: ' + JSON.stringify(res));
				},
				this
			);
		}
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
		if (!can(callback)) {
			callback = new CallbackInfo(
				function(res) {
					console.log('[default] res: ' + JSON.stringify(res));
				},
				this
			);
		}
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

	function getTimelines() {
		var scGlobal = createAtmosSearchCondition();
		var tlGlobal = createAtmosTimeline('tl_global_timeline', 'Global', 'all messages', this.createUrl('/messages/global_timeline'), scGlobal);
		var scMy = createAtmosSearchCondition();
		var tlMy = createAtmosTimeline('tl_my_timeline', 'My', 'The messages that my speakers says.', this.createUrl('/messages/focused_timeline'), scMy);
		var scTalk = createAtmosSearchCondition();
		var tlTalk = createAtmosTimeline('tl_talk_timeline', 'Talk', '', this.createUrl('/messages/talk_timeline'), scTalk);
		var scAnnounce = createAtmosSearchCondition();
		var tlAnnounce = createAtmosTimeline('tl_announce_timeline', 'Announce', '', this.createUrl('/messages/announce_timeline'), scAnnounce);
		var scMonolog = createAtmosSearchCondition();
		var tlMonolog = createAtmosTimeline('tl_monolog_timeline', 'Monolog', '', this.createUrl('/messages/monolog_timeline'), scMonolog);
		var scPrivate = createAtmosSearchCondition();
		var tlPrivate = createAtmosTimeline('tl_private_timeline', 'Private', '', this.createUrl('/private/timeline'), scPrivate);
		tlGlobal.init();
		tlMy.init();
		tlTalk.init();
		tlAnnounce.init();
		tlMonolog.init();
		tlPrivate.init();
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
//				{ "reaction-icon-class": "foundicon-checkmark", "reaction-count": 0 },
//				{ "reaction-icon-class": "foundicon-smiley", "reaction-count": 1 },
//				{ "reaction-icon-class": "foundicon-star", "reaction-count": 2 },
//				{ "reaction-icon-class": "foundicon-idea", "reaction-count": 3 },
//			]
//		};
		var generated = tmpl.render(context);
		return generated;
	}

	atmos = new Atmos();
})();

