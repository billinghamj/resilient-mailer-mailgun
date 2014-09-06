var test = require('tape');
var http = require('http');
var multiparty = require('multiparty');
var MailgunProvider = require('../lib/mailgun-provider');

test('correct types exported', function (t) {
	t.equal(typeof MailgunProvider, 'function');
	t.equal(typeof MailgunProvider.prototype.mail, 'function');

	t.end();
});

test('correct types after initialization', function (t) {
	var provider = new MailgunProvider('domain', 'api-key');

	t.assert(provider instanceof MailgunProvider);
	t.equal(typeof provider.mail, 'function');

	t.end();
});

test('invalid initialization causes exception', function (t) {
	t.throws(function () { new MailgunProvider(); });
	t.throws(function () { new MailgunProvider(0); });
	t.throws(function () { new MailgunProvider({}); });
	t.throws(function () { new MailgunProvider([]); });

	t.end();
});

test('empty options doesn\'t cause exception', function (t) {
	t.doesNotThrow(function () { new MailgunProvider('domain', 'api-key', {}); });

	t.end();
});

test('invalid message returns error', function (t) {
	var provider = new MailgunProvider('domain', 'api-key');

	t.plan(3);

	provider.mail(null, function (error) { t.notEqual(typeof error, 'undefined'); });
	provider.mail({}, function (error) { t.notEqual(typeof error, 'undefined'); });
	provider.mail({to:['']}, function (error) { t.notEqual(typeof error, 'undefined'); });
});

test('api used correctly when successful', function (t) {
	var domain = 'example.com';
	var apiKey = 'CuKLNA-awa4skvmqOWTHtCF'; // arbitrary

	var message = {
		from: 'no-reply@example.com',
		to: ['user@example.net', 'user@example.org'],
		cc: ['user2@example.net'],
		bcc: ['user3@example.net'],
		replyto: 'info@example.com',
		subject: 'testing, 123...',
		textBody: 'please disregard',
		htmlBody: '<p>please disregard</p>'
	};

	var expectedObject = {
		'from': ['no-reply@example.com'],
		'to': ['user@example.net,user@example.org'],
		'subject': ['testing, 123...'],
		'h:Reply-To': ['info@example.com'],
		'cc': ['user2@example.net'],
		'bcc': ['user3@example.net'],
		'text': ['please disregard'],
		'html': ['<p>please disregard</p>'],
		'o:testmode': ['true']
	};

	t.plan(5);

	var server = setupTestServer(t, domain,
		function (request, response) {
			var form = new multiparty.Form();

			var auth = request.headers['authorization'];
			var basic = new Buffer('api:' + apiKey).toString('base64');

			t.equals(auth, 'Basic ' + basic);

			form.parse(request, function (err, fields, files) {
				t.deepEquals(fields, expectedObject);
			});

			response.writeHead(200);
			response.end();
		},

		function (addr) {
			var options = {
				apiSecure: false,
				apiHostname: addr.address,
				apiPort: addr.port,
				testMode: true
			};

			var provider = new MailgunProvider(domain, apiKey, options);

			provider.mail(message, function (error) {
				t.equal(typeof error, 'undefined');

				server.close();
			});
		});
});

test('handles api errors correctly', function (t) {
	var domain = 'example.com';

	var message = {
		from: 'no-reply@example.com',
		to: ['user@example.net', 'user@example.org'],
		cc: ['user2@example.net'],
		bcc: ['user3@example.net'],
		replyto: 'info@example.com',
		subject: 'testing, 123...',
		textBody: 'please disregard',
		htmlBody: '<p>please disregard</p>'
	};

	t.plan(4);

	var server = setupTestServer(t, domain,
		function (request, response) {
			var error = JSON.stringify({ message: 'generic fail' });

			response.writeHead(503, { 'Content-Length': error.length });
			response.write(error);
			response.end();
		},

		function (addr) {
			var options = {
				apiSecure: false,
				apiHostname: addr.address,
				apiPort: addr.port
			};

			var provider = new MailgunProvider(domain, 'key', options);

			provider.mail(message, function (error) {
				t.notEqual(typeof error, 'undefined');
				t.equal(error.httpStatusCode, 503);

				server.close();
			});
		});
});

test('check lack of callback', function (t) {
	var domain = 'example.com';

	var message = {
		from: 'no-reply@example.com',
		to: ['user@example.net', 'user@example.org'],
		cc: ['user2@example.net'],
		bcc: ['user3@example.net'],
		replyto: 'info@example.com',
		subject: 'testing, 123...',
		textBody: 'please disregard',
		htmlBody: '<p>please disregard</p>'
	};

	t.plan(2);

	var server = setupTestServer(t, domain,
		function (request, response) {
			var error = JSON.stringify({ message: 'generic fail' });

			response.writeHead(503, { 'Content-Length': error.length });
			response.write(error);
			response.end();

			server.close();
		},

		function (addr) {
			var options = {
				apiSecure: false,
				apiHostname: addr.address,
				apiPort: addr.port
			};

			var provider = new MailgunProvider(domain, 'key', options);

			provider.mail(message);
		});
});

// will generate 2 assertions
function setupTestServer(t, domain, handler, callback) {
	var server = http.createServer(function (request, response) {
		t.equal(request.method, 'POST');
		t.equal(request.url, '/v2/' + domain + '/messages');

		handler(request, response);
	});

	server.listen(function () {
		var addr = server.address();

		callback(addr);
	});

	return server;
}
