/**
 * This provides a list of endpoints and client-side validation for any calls
 * to those endpoints.
 */
'use strict';

goog.provide('resources');

goog.require('utils');
goog.require('config');

var resources = { };

/** @enum {number} */
var validationTypes = {
	OBJECT: 0,
	STRING: 1,
	NUMBER: 2,
	ARRAY: 3,
	BOOLEAN: 4
};

/* jshint ignore:start */

/** @typedef {function(string, string, *)} */
var _validator;

/* jshint ignore:end */

/**
 * @param {boolean} required
 * @param {validationTypes|RegExp} type
 * @throws {Error}
 * @return {_validator}
 */
function validator(required, type) {
	return function(endpoint, param, data) {
		// Ignores request validation when tracking is disabled because information will be intentionally missing from requests
		if (utils.userPreferences.trackingDisabled) {
			return false;
		}
		// Ensure data is not a number before doing a !data otherwise the number can't be 0.
		if ((typeof data !== 'number') && !data) {
			if (required) {
				return utils.message(utils.messages.missingParam, [ endpoint, param ]);
			}
		}
		else if (type === validationTypes.OBJECT) {
			if (typeof data !== 'object') {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'an object' ]);
			}
		}
		else if (type === validationTypes.ARRAY) {
			if (!(data instanceof Array)) {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'an array' ]);
			}
		}
		else if (type === validationTypes.NUMBER) {
			if (typeof data !== 'number') {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'a number' ]);
			}
		}
		else if (type === validationTypes.BOOLEAN) {
			if (typeof data !== 'boolean') {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'a boolean' ]);
			}
		}
		// String or regex validator
		else if (typeof data !== 'string') {
			return utils.message(utils.messages.invalidType, [ endpoint, param, 'a string' ]);
		}
		else if (type !== validationTypes.STRING && !type.test(data)) {
			return utils.message(
				utils.messages.invalidType,
				[ endpoint, param, 'in the proper format' ]
			);
		}

		return false;
	};
}

function defaults(obj) {
	var def = {
		"randomized_device_token": validator(true, validationTypes.STRING),
		"randomized_bundle_token": validator(true, validationTypes.STRING),
		"sdk": validator(true, validationTypes.STRING),
		"sdk_version": validator(true, validationTypes.STRING),
		"session_id": validator(true, validationTypes.STRING)
	};
	return utils.merge(obj, def);
}

function v2defaults(obj) {
	var def = {
		"user_data": validator(true, validationTypes.STRING)
	};
	return utils.merge(obj, def);
}

resources.open = {
	destination: config.api_endpoint,
	endpoint: "/v1/open",
	method: utils.httpMethod.POST,
	params: {
		"randomized_device_token": validator(false, validationTypes.STRING),
		"randomized_bundle_token": validator(false, validationTypes.STRING),
		"link_identifier": validator(false, validationTypes.STRING),
		"sdk": validator(false, validationTypes.STRING),
		"options": validator(false, validationTypes.OBJECT),
		"initial_referrer": validator(false, validationTypes.STRING),
		"tracking_disabled": validator(false, validationTypes.BOOLEAN),
		"current_url": validator(false, validationTypes.STRING),
		"screen_height": validator(false, validationTypes.NUMBER),
		"screen_width": validator(false, validationTypes.NUMBER),
		"sdk_version": validator(false, validationTypes.STRING),
		"advertising_ids": validator(false, validationTypes.OBJECT)
	}
};

resources._r = {
	destination: config.app_service_endpoint,
	endpoint: "/_r",
	method: utils.httpMethod.GET,
	jsonp: true,
	params: {
		"sdk": validator(true, validationTypes.STRING),
		"_t": validator(false, validationTypes.STRING),
		"branch_key": validator(true, validationTypes.STRING)
	}
};

resources.linkClick = {
	destination: "",
	endpoint: "",
	method: utils.httpMethod.GET,
	queryPart: {
		"link_url": validator(true, validationTypes.STRING)
	},
	params: {
		"click": validator(true, validationTypes.STRING)
	}
};


resources.logout = {
	destination: config.api_endpoint,
	endpoint: "/v1/logout",
	method: utils.httpMethod.POST,
	params: defaults({
		"session_id": validator(true, validationTypes.STRING)
	})
};

resources.profile = {
	destination: config.api_endpoint,
	endpoint: "/v1/profile",
	method: utils.httpMethod.POST,
	params: defaults({
		"randomized_bundle_token": validator(true, validationTypes.STRING),
		"identity": validator(true, validationTypes.STRING)
	})
};

resources.link = {
	destination: config.api_endpoint,
	endpoint: "/v1/url",
	method: utils.httpMethod.POST,
	ref: "obj",
	params: defaults({
		"alias": validator(false, validationTypes.STRING),
		"campaign": validator(false, validationTypes.STRING),
		"channel": validator(false, validationTypes.STRING),
		"data": validator(false, validationTypes.STRING),
		"feature": validator(false, validationTypes.STRING),
		"randomized_bundle_token": validator(true, validationTypes.STRING),
		"stage": validator(false, validationTypes.STRING),
		"tags": validator(false, validationTypes.ARRAY),
		"type": validator(false, validationTypes.NUMBER),
		"source": validator(false, validationTypes.STRING),
		"instrumentation": validator(false, validationTypes.STRING)
	})
};

resources.qrCode = {
	destination: config.api_endpoint,
	endpoint: "/v1/qr-code",
	method: utils.httpMethod.POST,
	ref: "obj",
	params: defaults({
		"alias": validator(false, validationTypes.STRING),
		"campaign": validator(false, validationTypes.STRING),
		"channel": validator(false, validationTypes.STRING),
		"data": validator(false, validationTypes.STRING),
		"qr_code_settings": validator(false, validationTypes.STRING),
		"feature": validator(false, validationTypes.STRING),
		"randomized_bundle_token": validator(true, validationTypes.STRING),
		"stage": validator(false, validationTypes.STRING),
		"tags": validator(false, validationTypes.ARRAY),
		"type": validator(false, validationTypes.NUMBER),
		"source": validator(false, validationTypes.STRING)
	})
};

// v2/event endpoints

resources.logStandardEvent = {
	destination: config.api_endpoint,
	endpoint: "/v2/event/standard",
	method: utils.httpMethod.POST,
	params: v2defaults({
		"name": validator(true, validationTypes.STRING),
		"custom_data": validator(false, validationTypes.STRING),
		"event_data": validator(false, validationTypes.STRING),
		"content_items": validator(false, validationTypes.STRING),
		"customer_event_alias": validator(false, validationTypes.STRING)
	})
};

resources.logCustomEvent = {
	destination: config.api_endpoint,
	endpoint: "/v2/event/custom",
	method: utils.httpMethod.POST,
	params: v2defaults({
		"name": validator(true, validationTypes.STRING),
		"custom_data": validator(false, validationTypes.STRING),
		"event_data": validator(false, validationTypes.STRING),
		"content_items": validator(false, validationTypes.STRING),
		"customer_event_alias": validator(false, validationTypes.STRING)
	})
};

resources.crossPlatformIds = {
	destination: config.api_endpoint,
	endpoint: "/v1/cpid",
	method: utils.httpMethod.POST,
	params: {
		"user_data": validator(true, validationTypes.STRING)
	}
};

resources.lastAttributedTouchData = {
	destination: config.api_endpoint,
	endpoint: "/v1/cpid/latd",
	method: utils.httpMethod.POST,
	params: {
		"user_data": validator(true, validationTypes.STRING)
	}
};
