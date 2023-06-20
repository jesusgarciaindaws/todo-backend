'use strict';
const anxeb = require('anxeb-node');
const md5 = require('md5');

module.exports = {
	type    : anxeb.Route.types.action,
	access  : anxeb.Route.access.public,
	timeout : 60000,
	childs  : {
		user : {
			methods : {
				post : async function (context) {
					let prospect = context.payload.prospect;

					let registered_user = await context.data.find.User({ 'login.email' : prospect.email.trim().toLowerCase() });
					if (registered_user && registered_user.login.state !== 'unconfirmed') {
						context.log.exception.prospect_account_registered.args(prospect.email).throw(context);
					}

					let gpassword = "12345";
					let mpassword = md5(gpassword.toLowerCase());

					let user;
					if (registered_user) {
						user = registered_user;
						user.login.password = mpassword;
						user.meta = user.meta || {};
						user.meta.generated_password = mpassword;
						user.login.date = anxeb.utils.date.utc().unix();
						user.meta.headers = anxeb.utils.data.copy(context.req.headers);
						delete user.meta.deleted;
						user.markModified('meta');
					} else {
						user = context.data.create.User({
							first_names : prospect.first_names,
							last_names  : prospect.last_names,
							role        : 'client',
							login       : {
								provider : 'email',
								email    : prospect.email.trim().toLowerCase(),
								password : mpassword,
								state    : 'unconfirmed',
								date     : anxeb.utils.date.utc().unix(),
								token    : null,
							},
							info        : {},
							meta        : {
								created : anxeb.utils.date.utc().unix(),
								headers : anxeb.utils.data.copy(context.req.headers)
							}
						});
					}

					// const $user = await user.using(context).getUserWithContactId();
					await user.persist();

					// let fullName = $user.first_names + ' ' + $user.last_names;

					// try {
					// 	await context.smtp({
					// 		to      : fullName + ' <' + $user.login.email + '>',
					// 		subject : 'Registro To-do',
					// 		html    : '¡Hola ' + fullName + '!<br><br>' +
					// 			'Te damos una calurosa bienvenida al app <b>To-do</b>.<br>' +
					// 			'Desde ahora, podrás gestionar desde la palma de tu mano todas tus propiedades.<br><br>' +
					// 			'Para ingresar a tu nuevo perfil de usuario desde la app, utiliza el siguiente acceso:<br><br>' +
					// 			'Correo: <b>' + $user.login.email + '</b><br>' +
					// 			'Contraseña: <b>' + gpassword + '</b><br><br>' +
					// 			'Una vez accedas a tu cuenta, actualiza tus credenciales con una nueva contraseña.'
					// 	}).send();
					// } catch (err) {
					// 	context.log.exception.smtp_error.args(err).throw(context);
					// }

					context.send({
						user    : user.toClient(),
						message : {
							title : '¡Hola ' + user.first_names + '!',
							body  : '<header>¡Hola ' + user.first_names + '!</header>' +
								'<article>' +
								'<p>Te damos una calurosa bienvenida al app <br><span>To-do</span></p>' +
								'<p>Su contraseña es <a>' + gpassword + '</a>. Buenos días.</p>' +
								'</article>',
						},
					});
				}
			},
		}
	},
}