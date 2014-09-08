var http = require('http');
var https = require('https');
var FormData = require('form-data');

module.exports = MailgunProvider;

/**
 * Creates an instance of the Mailgun email provider.
 *
 * @constructor
 * @this {MailgunProvider}
 * @param {string} domain The Mailgun-registered domain to send email from.
 * @param {string} apiKey API Key for the Mailgun account holding the domain.
 * @param {object} [options] Additional optional configuration.
 * @param {boolean} [options.testMode=false] See: {@link http://documentation.mailgun.com/user_manual.html#sending-in-test-mode}
 * @param {boolean} [options.apiSecure=true] API connection protocol - true = HTTPS, false = HTTP
 * @param {string} [options.apiHostname=api.mailgun.net] Hostname for the API connection
 * @param {number} [options.apiPort] Port for the API connection - defaults to match the protocol (HTTPS-443, HTTP-80)
 */
function MailgunProvider(domain, apiKey, options) {
	if (typeof domain !== 'string'
		|| typeof apiKey !== 'string') {
		throw new Error('Invalid parameters');
	}

	options = options || {};

	if (typeof options.testMode === 'undefined')
		options.testMode = true;

	if (typeof options.apiSecure === 'undefined')
		options.apiSecure = true;

	options.apiHostname = options.apiHostname || 'api.mailgun.net';
	options.apiPort = options.apiPort || (options.apiSecure ? 443 : 80);

	this.domain = domain;
	this.apiKey = apiKey;
	this.options = options;
}

/**
 * Indicates the outcome of a mail-sending attempt.
 * @callback MailgunProvider~onResult
 * @param {error} [error] A non-null value indicates failure.
 */

/**
 * Attempts to send the message through the Mailgun API.
 *
 * @this {MailgunProvider}
 * @param {Message} message The message to send.
 * @param {MailgunProvider~onResult} [callback] Notified when the attempt fails or succeeds.
 */
MailgunProvider.prototype.mail = function (message, callback) {
	var form;

	// this can fail if the message is invalid
	try {
		form = this._formForMessage(message);
	} catch (error) {
		if (callback)
			callback(error);

		return;
	}

	var options = {
		hostname: this.options.apiHostname,
		port: this.options.apiPort,
		path: '/v2/' + this.domain + '/messages',
		method: 'POST',
		auth: 'api:' + this.apiKey,
		headers: form.getHeaders()
	};

	var protocol = this.options.apiSecure ? https : http;

	var request = protocol.request(options);

	form.pipe(request);
	request.end();

	// if no callback, the outcome doesn't matter
	if (!callback)
		return;

	request.on('error', function (error) {
		callback(error);
	});

	request.on('response', function (response) {
		if (response.statusCode == 200) {
			callback();
			response.socket.end();
			return;
		}

		var body = '';

		response.on('data', function (chunk) {
			body += chunk;
		});

		response.on('end', function (chunk) {
			var error = new Error('Email could not be sent');

			error.httpStatusCode = response.statusCode;
			error.httpResponseData = body;

			callback(error);
		});
	});
}

MailgunProvider.prototype._formForMessage = function (message) {
	message = message || {};
	message.to = message.to || [];
	message.cc = message.cc || [];
	message.bcc = message.bcc || [];

	// mailgun will return a 400 error if these are missing
	if (!message.from.length
		|| !message.to.length
		|| !message.subject
		|| (!message.textBody && !message.htmlBody)) {
		throw new Error('Invalid parameters');
	}

	var form = new FormData();

	form.append('from', message.from);
	form.append('to', message.to.join(','));
	form.append('subject', message.subject);

	if (message.replyto)
		form.append('h:Reply-To', message.replyto);

	if (message.cc.length)
		form.append('cc', message.cc.join(','));

	if (message.bcc.length)
		form.append('bcc', message.bcc.join(','));

	if (message.textBody)
		form.append('text', message.textBody);

	if (message.htmlBody)
		form.append('html', message.htmlBody);

	form.append('o:testmode', this.options.testMode ? 'true' : 'false');

	// todo: attachment support

	return form;
}
