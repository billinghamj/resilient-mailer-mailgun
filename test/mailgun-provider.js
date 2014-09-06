var test = require('tape');
var http = require('http');
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
