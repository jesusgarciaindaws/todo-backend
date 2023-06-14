'use strict';

const md5 = require("md5");
const anxeb = require('anxeb-node');

module.exports = function (context, user) {
	const _context = context;
	const _user = user;

	return {
		getSecret              : async function () {
			if (_user.meta == null || _user.meta.secret == null) {
				_user.meta = _user.meta || {};
				_user.meta.secret = md5(`${_user._id.toString()}${_context.utils.security.getRandomPassword()}}`.toLowerCase());
				_user.markModified('meta');
				_user.persist();
			}

			return _user.meta.secret;
		},
		getSocialValidation    : async function (credentials) {
			//TODO: Server to server social auth verification
			return true;
		},
		getAuthResponse        : async function (params = {}) {
			const self = this;

			_user.login.date = anxeb.utils.date.utc().unix();
			let $user = _user.toClient();

			_context.data.retrieve.User(_user._id || _user.id).then(function (user) {
				user.login.date = anxeb.utils.date.utc().unix();
				if (params.changes) {
					params.changes(user);
				}
				user.persist();
			}).catch(function (err) { });

			let $type = $user.role === 'admin' ? 'system' : 'app';
			let $roles = [`${$type}_${$user.role}`];

			return {
				user     : $user,
				roles    : $roles,
				provider : $user.login.provider,
				token    : context.sign({
					user     : {
						id          : $user.id,
						first_names : $user.first_names,
						last_names  : $user.last_names,
						email       : $user.login.email.trim().toLowerCase(),
						info        : $user.info,
						meta        : $user.meta,
						role        : $user.role,
					},
					identity : $user.id,
					claims   : [],
					roles    : $roles,
					type     : $type,
				}),
				flags    : {
					change_pass : user.meta != null && user.login.password === user.meta.generated_password
				},
			};
		},
		sendSocialWelcomeEmail : async function () {
			const { first_names, last_names, login : { email } } = _user;
			let $message;
			try {
				let fullName = first_names + ' ' + last_names;
				await context.smtp({
					to      : fullName + ' <' + email + '>',
					subject : 'Registro To-do',
					html    : '¡Hola ' + fullName + '!<br><br>' +
						'Te damos una calurosa bienvenida al app <b>To-do</b>.<br>' +
						'Desde ahora, podrás gestionar desde la palma de tu mano todas tus tareas.'
				}).send();

				$message = {
					title : '¡Hola ' + first_names + '!',
					body  : '<header>¡Hola ' + first_names + '!</header>' +
						'<article>' +
						'<p>Te damos una calurosa bienvenida al app <br><span>To-do</span></p>' +
						'<p>Por favor revisa tu correo <a>' + email + '</a> para más información.</p>' +
						'</article>'
				}
			} catch (err) {
				context.log.exception.smtp_error.args(err).throw();
			}

			return $message;
		},
	}
};