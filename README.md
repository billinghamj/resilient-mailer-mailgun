# resilient-mailer-mailgun

`resilient-mailer-mailgun` implements Mailgun as an email provider for
[`resilient-mailer`](https://github.com/billinghamj/resilient-mailer).

```js
var MailgunProvider = require('resilient-mailer-mailgun');

var mailgun = new MailgunProvider('example.com', 'key-MyApiKey');

var mailer; // ResilientMailer instance
mailer.registerProvider(mailgun);
```

## Installation

```bash
$ npm install resilient-mailer-mailgun
```

## Usage

Create an instance of the provider. Optionally, you can enable
[test mode](http://documentation.mailgun.com/user_manual.html#sending-in-test-mode).

```js
var MailgunProvider = require('resilient-mailer-mailgun');

var mailgun = new MailgunProvider('example.com', 'key-MyApiKey', { testMode: true });
```

To register the provider with your `ResilientMailer` instance:

```js
var mailer; // ResilientMailer instance
mailer.registerProvider(mailgun);
```

In the event that you want to use `MailgunProvider` directly (rather than the
usual way - via `ResilientMailer`):

```js
var message = {
	from: 'no-reply@example.com',
	to: ['user@example.net'],
	subject: 'Testing my new email provider',
	textBody: 'Seems to be working!',
	htmlBody: '<p>Seems to be working!</p>'
};

mailgun.send(message, function (error) {
	if (!error)
		console.log('Success! The message sent successfully.');

	else
		console.log('Message sending failed - ' + error.message);
});
```

To see everything available in the `message` object, refer to
[resilient-mailer](https://github.com/billinghamj/resilient-mailer).

## Notes

One instance of the provider covers one domain. To send from multiple domains,
you should set up multiple `ResilientMailer` instances, with multiple matching
provider instances.

## Testing

Install the development dependencies first:

```bash
$ npm install
```

Then the tests:

```bash
$ npm test
```

## Support

Please open an issue on this repository.

## Authors

- James Billingham <james@jamesbillingham.com>

## License

MIT licensed - see [LICENSE](LICENSE) file
