'use strict';

goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');
goog.require('session');
goog.require('safejson');

goog.require('goog.json'); // jshint unused:false

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, BranchStorage */

describe('Branch', function() {
	var storage = new BranchStorage([ 'pojo' ]);
	var sandbox;
	var requests;

	window.sdk_version = config.version;

	beforeEach(function() {
		testUtils.go('');
		sandbox = sinon.sandbox.create();
		localStorage.clear();
		sessionStorage.clear();
		requests = [];
	});

	function initBranch(runInit, keepStorage) {
		if (!keepStorage) {
			storage.clear();
		}
		var branch = new Branch();

		sandbox.stub(branch._server, 'request', function(resource, obj, storage, callback) {
			requests.push({
				resource: resource,
				obj: obj,
				callback: callback
			});
		});

		if (runInit) {
			branch.init(branch_sample_key);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					session_id: session_id
				}
			);
			requests[2].callback(null, {});
			requests = [];
		}

		return branch;
	}

	function basicTests(call, params) {
		it('should silently fail if branch not initialized', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(params.length * 2, done);

			function basicTest(param) {
				var p = testUtils.nulls(param);
				branch[call].apply(branch, p.concat(function(err) {
					assert.strictEqual(err.message, 'Branch SDK not initialized');
				}));
			}

			for (var i = 0; i < params.length; i++) {
				basicTest(params[i]);
			}
			done();
		});
	}

	var originalUa = navigator.userAgent;
	function setUserAgent(ua) {
		navigator.__defineGetter__("userAgent", function() {
			return ua;
		});
	}


	afterEach(function() {
		setUserAgent(originalUa);
		sandbox.restore();
	});

	describe('init', function() {
		it('should call api with params and version', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(7, done);
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			var expectedResponse = {
				"session_id": "113636235674656786",
				"identity_id": "98807509250212101",
				"identity": "Branch",
				"has_app": true,
				"referring_link": null
			};

			branch.init(branch_sample_key, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert.strictEqual(err, null, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);
			requests[2].callback(null, {});

			assert.deepEqual(requests[0].resource.endpoint, '/_r', 'Request to open made');
			assert.deepEqual(
				requests[0].obj,
				{
					"sdk": "connected" + config.version,
					branch_key: branch_sample_key
				},
				'Request params to _r correct'
			);

			assert.deepEqual(requests[1].resource.endpoint, '/v1/open', 'Request to open made');
			assert.deepEqual(
				requests[1].obj,
				{
					"branch_key": branch_sample_key,
					"link_identifier": undefined,
					"initial_referrer": requests[1].obj.initial_referrer,
					"browser_fingerprint_id": browser_fingerprint_id,
					"alternative_browser_fingerprint_id": undefined,
					"sdk": "connected" + config.version,
					"options": { },
					"current_url": utils.getCurrentUrl(),
					"screen_height": utils.getScreenHeight(),
					"screen_width": utils.getScreenWidth()
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 3, '3 requests made');
		});

		it('should not whitelist referring_link', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(7, done);
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			var expectedResponse = {
				"session_id": "113636235674656786",
				"identity_id": "98807509250212101",
				"identity": "Branch",
				"has_app": true,
				"referring_link": '/c/ngJf86-h'
			};

			branch.init(branch_sample_key, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert.strictEqual(err, null, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);
			requests[2].callback(null, {});

			assert.deepEqual(requests[0].resource.endpoint, '/_r', 'Request to open made');
			assert.deepEqual(
				requests[0].obj,
				{
					"sdk": "connected" + config.version,
					branch_key: branch_sample_key
				},
				'Request params to _r correct'
			);

			assert.deepEqual(requests[1].resource.endpoint, '/v1/open', 'Request to open made');
			assert.deepEqual(
				requests[1].obj,
				{
					"branch_key": branch_sample_key,
					"link_identifier": undefined,
					"initial_referrer": requests[1].obj.initial_referrer,
					"browser_fingerprint_id": browser_fingerprint_id,
					"alternative_browser_fingerprint_id": undefined,
					"sdk": "connected" + config.version,
					"options": { },
					"current_url": utils.getCurrentUrl(),
					"screen_height": utils.getScreenHeight(),
					"screen_width": utils.getScreenWidth()
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 3, '3 requests made');
		});

		it('should support being called without a callback', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(1, done);

			branch.init(branch_sample_key);

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id
				}
			);
			requests[2].callback(null, {});

			assert(true, 'Succeeded');
		});

		it('should return invalid app id error', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(1, done);
			branch.init(branch_sample_key, function(err) {
				assert.strictEqual(err.message, 'Invalid app id');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(new Error('Invalid app id'));
		});

		it('should fail early on browser fingerprint error', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(2, done);
			branch.init(branch_sample_key, function(err) {
				assert.strictEqual(err.message, 'Browser fingerprint fetch failed');
				assert.strictEqual(requests.length, 1, 'Only 1 request made');
			});
			requests[0].callback(new Error('Browser fingerprint fetch failed'));
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			if (testUtils.go('#r:12345')) {
				var branch = initBranch(false);
				var assert = testUtils.plan(3, done);

				branch.init(branch_sample_key, function(err, data) {
					assert.strictEqual(
						JSON.parse(localStorage.getItem('branch_session_first')).click_id,
						'12345',
						'hash session_id stored in local storage'
					);
					assert.strictEqual(
						utils.mobileUserAgent() ?
							'12345' :
							JSON.parse(sessionStorage.getItem('branch_session')).click_id,
						'12345',
						'hash session_id saved in session storage'
					);
				});

				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(
					null,
					{
						session_id: "1234",
						something: "else"
					}
				);
				requests[2].callback(null, {});

				assert.deepEqual(
					requests[1].obj,
					{
						"branch_key": branch_sample_key,
						"link_identifier": '12345',
						"initial_referrer": requests[1].obj.initial_referrer,
						"browser_fingerprint_id": '12345',
						"alternative_browser_fingerprint_id": undefined,
						"sdk": "connected" + config.version,
						"options": { },
						"current_url": utils.getCurrentUrl(),
						"screen_height": utils.getScreenHeight(),
						"screen_width": utils.getScreenWidth()
					},
					'Request to open params correct'
				);
			}
			else {
				done();
			}
		});

		it(
			'should store in session and call open with link_identifier from get param',
			function(done) {
				if (testUtils.go('?_branch_match_id=67890')) {
					var branch = initBranch(false);
					var assert = testUtils.plan(3, done);

					branch.init(branch_sample_key, function(err, data) {
						assert.strictEqual(
							JSON.parse(localStorage.getItem('branch_session_first')).click_id,
							'67890',
							'get param match id stored in local storage'
						);
						assert.strictEqual(
							utils.mobileUserAgent() ?
								'67890' :
								JSON.parse(sessionStorage.getItem('branch_session')).click_id,
							'67890',
							'get param match id saved in session storage'
						);
					});

					requests[0].callback(null, browser_fingerprint_id);
					requests[1].callback(
						null,
						{
							session_id: "1234",
							something: "else"
						}
					);
					requests[2].callback(null, {});

					assert.deepEqual(
						requests[1].obj,
						{
							"branch_key": branch_sample_key,
							"link_identifier": '67890',
							"initial_referrer": requests[1].obj.initial_referrer,
							"browser_fingerprint_id": '67890',
							"alternative_browser_fingerprint_id": undefined,
							"sdk": "connected" + config.version,
							"options": { },
							"current_url": utils.getCurrentUrl(),
							"screen_height": utils.getScreenHeight(),
							"screen_width": utils.getScreenWidth()
						},
						'Request to open params correct'
					);
				}
				else {
					done();
				}
			}
		);

		it('should not call has_app if no session present', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(2, done);
			branch.init(branch_sample_key, function(err, data) {
				assert.strictEqual(requests.length, 2, 'two requests made');
				assert.deepEqual(
					requests[0].resource.endpoint,
					'/_r',
					'Request to open made, not has_app'
				);
			});
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id
				}
			);
			requests[2].callback(null, {});
		});

		it('should call has_app if session present but no link_identifier from get param',
			function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(3, done);
			branch.init(branch_sample_key);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					data: JSON.stringify({
						'$desktop_url': window.location.protocol + "//" +
										window.location.host +
										window.location.pathname
					})
				}
			);
			requests[2].callback(null, {});

			requests = [ ];
			branch = initBranch(false, true);
			branch.init(branch_sample_key);

			assert.strictEqual(requests.length, 2, 'Should make 2 requests');
			assert.deepEqual(
				requests[0].resource.endpoint,
				'/_r',
				'First request should be sent to /_r'
			);
			assert.deepEqual(
				requests[1].resource.endpoint,
				'/v1/has-app',
				'Second request should be sent to /v1/has-app'
			);
		});

		it('should not call has_app if session and link_identifier present', function(done) {
			var assert = testUtils.plan(3, done);
			if (testUtils.go('?_branch_match_id=67890')) {

				var branch = initBranch(false);
				branch.init(branch_sample_key);

				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(
					null,
					{
						session_id: session_id,
						browser_fingerprint_id: browser_fingerprint_id,
						identity_id: identity_id,
						data: JSON.stringify({
							'$desktop_url': window.location.protocol + "//" +
											window.location.host +
											window.location.pathname
						})
					}
				);

				branch = initBranch(false, true);
				branch.init(branch_sample_key);

				requests[3].callback(null, browser_fingerprint_id);
				requests[4].callback(
					null,
					{
						session_id: session_id,
						browser_fingerprint_id: browser_fingerprint_id,
						identity_id: identity_id,
						data: JSON.stringify({
							'$desktop_url': window.location.protocol + "//" +
											window.location.host +
											window.location.pathname
						})
					}
				);
				requests[5].callback(null, {});

				assert.strictEqual(requests.length, 6, 'Should make 6 requests');
				assert.deepEqual(
					requests[3].resource.endpoint,
					'/_r',
					'First request should be sent to /_r'
				);
				assert.deepEqual(
					requests[4].resource.endpoint,
					'/v1/open',
					'Second request should be sent to /v1/open'
				);
			}
			else {
				assert.fail();
			}
		});

		it('should not call _r if userAgent is safari 11 or greater',	function(done) {
			var safari11Ua = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1';
			setUserAgent(safari11Ua);
			if (navigator.userAgent !== safari11Ua) {
				return done();
			}

			var branch = initBranch(false);
			var assert = testUtils.plan(1, done);

			branch.init(branch_sample_key);

			requests[0].callback(
				null,
				{
					session_id: "1234",
					something: "else"
				}
			);
			requests[1].callback(null, {});

			assert.deepEqual(
				requests[0].resource.endpoint,
				'/v1/open',
				'First request should be sent to /v1/open'
			);

			assert.deepEqual(
				requests[0].obj,
				{
					"branch_key": branch_sample_key,
					"link_identifier": undefined,
					"initial_referrer": requests[0].obj.initial_referrer,
					"browser_fingerprint_id": undefined,
					"alternative_browser_fingerprint_id": undefined,
					"sdk": "connected" + config.version,
					"options": { },
					"current_url": utils.getCurrentUrl(),
					"screen_height": utils.getScreenHeight(),
					"screen_width": utils.getScreenWidth()
				},
				'Request to open params correct'
			);
		});

		it('should not call _r if session present but no link_identifier and safari 11 or greater',
			function(done) {
			var safari11Ua = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1';
			setUserAgent(safari11Ua);
			if (navigator.userAgent !== safari11Ua) {
				return done();
			}

			var branch = initBranch(false);
			var assert = testUtils.plan(2, done);

			branch.init(branch_sample_key);
			requests[0].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: undefined,
					identity_id: identity_id,
					data: JSON.stringify({
						'$desktop_url': window.location.protocol + "//" +
										window.location.host +
										window.location.pathname
					})
				}
			);
			requests[1].callback(null, {});

			requests = [ ];
			branch = initBranch(false, true);
			branch.init(branch_sample_key);

			assert.strictEqual(requests.length, 1, 'Should make 2 requests');
			assert.deepEqual(
				requests[0].resource.endpoint,
				'/v1/has-app',
				'Second request should be sent to /v1/has-app'
			);
		});

	});

	describe('data', function() {
		it('should return whitelisted session storage data', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			var data = safejson.stringify({ 'key_1': 'value_1' });
			var whitelistedData = {
				'data': data,
				'referring_identity': 'referring_user',
				'identity': 'identity',
				'has_app': false,
				'referring_link': '/c/ngJf86-h'
			};
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			sandbox.stub(session, 'get', function(storage) {
				return whitelistedData;
			});

			branch.data(function(err, res) {
				assert.strictEqual(err, null, 'No error');
				assert.deepEqual(res, whitelistedData, 'whitelisted data returned');
			});
		});
	});

	describe('setIdentity', function() {
		basicTests('setIdentity', [ 1 ]);

		it('should call api with identity', function(done) {
			var expectedRequest = testUtils.params(
				{ "identity": "test_identity" },
				[ "_t" ]
			);
			var expectedResponse = {
				identity_id: '12345',
				link: 'url',
				referring_data: '{ }',
				referring_identity: '12345'
			};
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			branch.setIdentity('test_identity', function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});

		it('should update identity and identity_id in local storage', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			branch.setIdentity('12345678', function(err, data) {
				var localData = safejson.parse(localStorage.getItem('branch_session_first'));
				assert.strictEqual(localData['identity'], '12345678');
				assert.strictEqual(localData['identity_id'], '7654321');
			});
			requests[0].callback(null, { identity: '12345678', identity_id: '7654321' });
		});
	});

	describe('setIdentity accepts empty data', function() {
		var expectedRequest = testUtils.params(
			{ "identity": "test_identity" },
			[ "_t" ]
		);
		var expectedResponse = { };
		it('should call api with identity', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			branch.setIdentity('test_identity', function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('track', function() {
		basicTests('track', [ 1, 2 ]);

		it('should call api with event with no metadata', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			branch.track('test_event', function(err) {
				assert.strictEqual(err, null, 'No error');
			});
			var expectedRequest = {
				"event": "test_event",
				"metadata": {
					"url": document.URL,
					"user_agent": navigator.userAgent,
					"language": navigator.language
				},
				"branch_key": branch_sample_key,
				"session_id": session_id,
				"browser_fingerprint_id": browser_fingerprint_id,
				"sdk": "connected" + config.version,
				"initial_referrer": requests[0].obj.initial_referrer
			};
			expectedRequest.identity_id = identity_id;

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null);

			assert.deepEqual(requests[0].obj, expectedRequest, 'Expected request sent');
		});

		it('should call api with event with metadata', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			var metadata = {
				"test": "meta_data"
			};
			branch.track('test_event', metadata, function(err) {
				assert.strictEqual(err, null, 'No error');
			});
			var expectedRequest = {
				"event": "test_event",
				"metadata": {
					"url": document.URL,
					"user_agent": navigator.userAgent,
					"language": navigator.language,
					"test": "meta_data"
				},
				"branch_key": branch_sample_key,
				"session_id": session_id,
				"browser_fingerprint_id": browser_fingerprint_id,
				"sdk": "connected" + config.version,
				"initial_referrer": requests[0].obj.initial_referrer
			};
			expectedRequest.identity_id = identity_id;

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null);
			assert.deepEqual(requests[0].obj, expectedRequest, 'Expected request sent');
		});
	});

	describe('logout', function() {
		basicTests('logout', [ 0 ]);

		it('should call api with branch_key and session_id', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			branch.logout(function(err) {
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ }, [ "_t" ]),
				'All params sent'
			);
		});

		it(
			'should overwrite existing session_id, sessionLink, and identity_id\'s',
			function(done) {
				var branch = initBranch(true);
				var assert = testUtils.plan(6, done);
				branch.logout(function(err) {
					assert.strictEqual(err, null, 'No error');
				});

				assert.strictEqual(requests.length, 1, 'Request made');

				var newSessionId = 'new_session';
				var newIdentityId = 'new_id';
				var newLink = 'new_link';

				requests[0].callback(
					null,
					{
						"identity_id": newIdentityId,
						"session_id": newSessionId,
						"link": newLink
					}
				);
				assert.deepEqual(
					requests[0].obj,
					testUtils.params({ }, [ "_t" ]),
					'All params sent'
				);
				assert.strictEqual(branch.session_id, newSessionId, 'branch session was replaced');
				assert.strictEqual(
					branch.identity_id,
					newIdentityId,
					'branch identity was replaced'
				);
				assert.strictEqual(branch.sessionLink, newLink, 'link was replaced');
			}
		);
	});

	describe('link', function() {
		basicTests('link', [ 1 ]);

		var expectedRequest = function(serialized, source, desktopUrlAppend) {
			var val = testUtils.params({
				tags: [ 'tag1', 'tag2' ],
				channel: 'sample app',
				feature: 'create link',
				stage: 'created link',
				type: 1,
				data: {
					mydata: 'bar',
					'$desktop_url': 'https://cdn.branch.io/example.html',
					'$og_title': 'Branch Metrics',
					'$og_description': 'Branch Metrics',
					'$og_image_url': 'http://branch.io/img/logo_icon_white.png',
					'$canonical_url': 'https://cdn.branch.io/example.html',
					'$og_video': null,
					'$og_type': 'product'
				},
				"sdk": "connected" + config.version
			}, [ "_t" ]);
			if (desktopUrlAppend) {
				val['data']['$desktop_url'] += desktopUrlAppend;
			}
			if (serialized) {
				val['data'] = JSON.stringify(val['data']);
			}
			if (source) {
				val['source'] = 'connected-sdk';
			}
			return val;
		};

		var expectedResponse = {
			"url": "https://bnc.lt/l/3HZMytU-BW"
		};

		it('should call api with serialized data and return link with browser_fingerprint_id appended', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);
			branch.link(expectedRequest(), function(err, link) {
				assert.strictEqual(err, null, 'No error');
				assert.strictEqual(link, expectedResponse['url'], 'link returned');
			});
			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest(true, true), 'All params sent');
		});

		it('an error should be returned causing .link() to return a bnc.lt long link', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(20, done);
			branch.link(expectedRequest(), function(err, link) {
				var urlParser = document.createElement("a");
				urlParser.href = link;
				assert.strictEqual(urlParser.protocol, "https:", "Dynamic BNC link's protocol is correct");
				var hostWithoutPort = urlParser.host;
				if (hostWithoutPort.indexOf(':') > -1) {
					hostWithoutPort = hostWithoutPort.substring(0, hostWithoutPort.indexOf(':'));
				}
				assert.strictEqual(hostWithoutPort, "bnc.lt", "Dynamic BNC link's host correct");
				// making sure that this test doesn't fail in IE10
				var pathName = urlParser.pathname;
				if (pathName[0] === '/') {
					pathName = pathName.substring(1, pathName.length);
				}
				assert.strictEqual(pathName, "a/key_live_ljmAgMXod0f4V0wNEf4ZubhpphenI4wS", "Dynamic BNC link's pathname correct");

				var queryParams = urlParser.search.replace('?', '');
				queryParams = queryParams.split('&');

				var expectedQueryParams = {
					tags: [ 'tag1', 'tag2' ],
					channel: 'sample app',
					feature: 'create link',
					stage: 'created link',
					type: "1",
					sdk: 'connected' + config.version,
					source: 'connected-sdk',
					data: { "mydata":"bar", "$desktop_url":"https://cdn.branch.io/example.html", "$og_title":"Branch Metrics", "$og_description":"Branch Metrics", "$og_image_url":"http://branch.io/img/logo_icon_white.png", "$canonical_url":"https://cdn.branch.io/example.html", "$og_video":null, "$og_type":"product" }
				};
				var actual = {};
				for (var i = 0; i < queryParams.length; i++) {
					var keyValuePair = queryParams[i].split('=');
					var key = keyValuePair[0];
					var value = decodeURIComponent(keyValuePair[1]);
					if (key === 'tags') {
						if (!actual[key]) {
							actual[key] = [];
						}
						actual[key].push(value);
					}
					else {
						actual[key] = value;
					}
				}
				// jshint maxdepth:5
				for (var property in expectedQueryParams) {
					if (expectedQueryParams.hasOwnProperty(property)) {
						assert.strictEqual(true, actual.hasOwnProperty(property), "property exists in dynamic bnc link");
						var valActual = decodeURIComponent(actual[property]);
						if (property === 'data') {
							valActual = atob(valActual);
							valActual = JSON.parse(valActual);
							assert.deepEqual(expectedQueryParams['data'], valActual, 'data object appended correctly to dynamic BNC link');
						}
						else if (property === 'tags') {
							valActual = valActual.split(',');
							for (var t = 0; t < expectedQueryParams[property].length; t++) {
								var valueExists = expectedQueryParams[property].indexOf(valActual[t]) > -1;
								assert.strictEqual(true, valueExists, 'tag is correctly appended to dynamic bnc.lt link');
							}
						}
						else {
							assert.strictEqual(expectedQueryParams[property], valActual, 'property\'s value exists in dynamic bnc link');
						}
					}
				}
			});
			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(new Error('error message abc'));
		});

		it('should add source = "connected-sdk" to link data', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			branch.link(expectedRequest());
			assert.strictEqual(requests.length, 1, 'Request made');
			assert.strictEqual(requests[0].obj['source'], 'connected-sdk', 'connected-sdk source set');
		});

		it('should remove r hash from desktop_url', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			branch.link(expectedRequest(false, false, '#r:12345'));
			assert.strictEqual(requests.length, 1, 'Request made');
			assert.strictEqual(
				JSON.parse(requests[0].obj['data'])['$desktop_url'].indexOf('#r:12345'),
				-1,
				'connected-sdk source set'
			);
		});
	});

	describe('disableTracking() tests', function() {
		it('Flow with branch.init(), branch.disableTracking(true), branch.disableTracking(false)', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(6, done);
			branch.init(branch_sample_key, function(err, data) {
				assert.strictEqual(err, null, 'No error');
			});
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: "1234",
					something: "else"
				}
			);
			requests[2].callback(null, {});

			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', sessionStorage.getItem('branch_session'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', localStorage.getItem('branch_session_first'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');

			branch.disableTracking(true);
			assert.strictEqual("{}", sessionStorage.getItem('branch_session'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
			assert.strictEqual("{}", localStorage.getItem('branch_session_first'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');

			branch.disableTracking(false);
			requests[3].callback(null, browser_fingerprint_id);
			requests[4].callback(
				null,
				{
					session_id: "1234",
					something: "else"
				}
			);
			requests[5].callback(null, {});
			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', sessionStorage.getItem('branch_session'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', localStorage.getItem('branch_session_first'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
		});
	});
});
