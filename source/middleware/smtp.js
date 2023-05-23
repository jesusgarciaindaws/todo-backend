'use strict';

const anxeb = require('anxeb-node');
const nodemailer = require('node4mailer');
const footer = '<br><br>' + 'To-do' + '<div style="height: 40px; padding-top: 10px; margin-top: 16px; border-top:solid 1px #E6E6E6;"><img src="https://nodrix.com/wp-content/uploads/2020/06/nodrix_logo.png" alt="logo" style="height: 40px"/></div>';

module.exports = function (settings) {
	let _transporter = nodemailer.createTransport(settings);

	return function (context, params) {
		let $params = anxeb.utils.data.copy(params);
		$params.html += footer;
		if (!$params.from) {
			$params.from = settings.account;
		}

		return {
			send : function () {
				return new Promise(function (resolve, reject) {
					context.log.debug.smtp_email_sending.args($params.to).print();
					_transporter.sendMail($params, function (err, info) {
						if (err) {
							reject(err);
						} else {
							context.log.debug.smtp_email_sent.args(params.to).print();
							resolve(info);
						}
					});
				});
			}
		}
	};
}