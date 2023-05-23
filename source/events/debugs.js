'use strict';

let eventTypes = require('anxeb-node').Event.types;

module.exports = {
	smtp_email_sent    : {
		message : 'SMTP email to [0] successfully sent',
		code    : 5003,
		type    : eventTypes.debug_log
	},
	smtp_email_sending : {
		message : 'Sending email to [0]',
		code    : 5004,
		type    : eventTypes.debug_log
	}
};