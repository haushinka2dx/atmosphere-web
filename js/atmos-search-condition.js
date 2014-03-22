/*
・keywords:
　メッセージ本文に部分一致させたい文字列を指定する。
　カンマ区切りで複数文字列を指定可能であり、その場合は全てORで結合される。
　※ and_or の指定とは無関係
・hashtags:
　メッセージ中のハッシュタグを完全一致で指定する。
　カンマ区切りで複数指定可能であり、その場合は全てORで結合される。
　※ and_or の指定とは無関係
・responses:
　memo, fun, good, usefull が指定可能。
　指定されたリアクションが1つでもあるメッセージのみに絞り込む。
　カンマ区切りで複数指定可能であり、その場合は指定したうちのいずれか１つでも
　リアクションがあれば検索にヒットする。
　※ and_or の指定とは無関係
・created_by:
　メッセージの発信者を完全一致で指定する。
　カンマ区切りで複数指定が可能であり、その場合は指定したユーザーのいずれかが
　発信したメッセージであれば検索にヒットする。
　※ and_or の指定とは無関係
・address_users:
　メッセージの宛先（ユーザー）を完全一致で指定する。
　カンマ区切りで複数指定が可能であり、その場合は指定したユーザーのいずれかが
　宛先に含まれていれば検索にヒットする。
　※ and_or の指定とは無関係
・address_groups:
　メッセージの宛先（グループ）を完全一致で指定する。
　カンマ区切りで複数指定が可能であり、その場合は指定したグループのいずれかが
　宛先に含まれていれば検索にヒットする。
　※システムグループかユーザーグループかの指定は出来ない
　※ and_or の指定とは無関係
・message_types
　メッセージの種別を指定する。具体的には message, announce, monolog が指
定可能。
　複数指定した場合は指定したうちのいずれかの種別であれば検索にヒットする。
　※ and_or の指定とは無関係
*/

var createAtmosSearchCondition = undefined;

(function() {
	function AtmosSearchCondition() {
		this.count(-1);
	};
	AtmosSearchCondition.prototype = {
		count : count,
		futureThan : futureThan,
		pastThan : pastThan,
		andOr : andOr,
		keywords : keywords,
		hashtags : hashtags,
		responses : responses,
		createdBy : createdBy,
		addressUsers : addressUsers,
		addressGroups : addressGroups,
		messageTypes : messageTypes,
		toJSON : toJSON,
		toGETParameters : toGETParameters,
	}

	function count(argCount) {
		if (can(argCount)) {
			this._count = argCount;
		}
		return this._count;
	}

	function futureThan(argFutureThan) {
		if (can(argFutureThan)) {
			this._futureThan = argFutureThan;
		}
		return this._futureThan;
	}

	function pastThan(argPastThan) {
		if (can(argPastThan)) {
			this._pastThan = argPastThan;
		}
		return this._pastThan;
	}

	function andOr(argAndOr) {
		if (can(argAndOr)) {
			this._andOr = argAndOr;
		}
		return this._andOr;
	}

	function keywords(argKeywords) {
		if (can(argKeywords)) {
			this._keywords = argKeywords;
		}
		return this._keywords;
	}

	function hashtags(argHashtags) {
		if (can(argHashtags)) {
			this._hashtags = argHashtags;
		}
		return this._hashtags;
	}

	function responses(argResponses) {
		if (can(argResponses)) {
			this._responses = argResponses;
		}
		return this._responses;
	}

	function createdBy(argCreatedBy) {
		if (can(argCreatedBy)) {
			this._created_by = argCreatedBy;
		}
		return this._created_by;
	}

	function addressUsers(argAddressUsers) {
		if (can(argAddressUsers)) {
			this._addressUsers = argAddressUsers;
		}
		return this._addressUsers;
	}

	function addressGroups(argAddressGroups) {
		if (can(argAddressGroups)) {
			this._addressGroups = argAddressGroups;
		}
		return this._addressGroups;
	}

	function messageTypes(argMessageTypes) {
		if (can(argMessageTypes)) {
			this._messageTypes = argMessageTypes;
		}
		return this._messageTypes;
	}

	function toJSON() {
		var j = {};
		if (can(this.count())) {
			j['count'] = this.count();
		}
		if (can(this.futureThan())) {
			j['future_than'] = this.futureThan();
		}
		if (can(this.pastThan())) {
			j['past_than'] = this.pastThan();
		}
		if (can(this.andOr())) {
			j['and_or'] = this.andOr();
		}
		if (can(this.keywords())) {
			j['keywords'] = this.keywords();
		}
		if (can(this.hashtags())) {
			j['hashtags'] = this.hashtags();
		}
		if (can(this.responses())) {
			j['responses'] = this.responses();
		}
		if (can(this.createdBy())) {
			j['created_by'] = this.createdBy();
		}
		if (can(this.addressUsers())) {
			j['address_users'] = this.addressUsers();
		}
		if (can(this.addressGroups())) {
			j['address_groups'] = this.addressGroups();
		}
		if (can(this.messageTypes())) {
			j['message_types'] = this.messageTypes();
		}
		return j;
	}

	function toGETParameters() {
		var params = [];
		var j = this.toJSON();
		Object.keys(j).forEach(function(k) {
			var v = j[k];
			if (canl(k) && canl(v)) {
				params.push(k + '=' + v);
			}
		});
		return params.join('&');
	}

	createAtmosSearchCondition = function() {
		return new AtmosSearchCondition();
	}

})();
