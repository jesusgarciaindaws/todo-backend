'use strict';

const anxeb = require('anxeb-node');
const md5 = require('md5');
const ObjectId = require('anxeb-mongoose').ObjectId;

module.exports = {
	type    : anxeb.Route.types.action,
	access  : anxeb.Route.access.public,
	timeout : 60000,
	childs  : {
		recover  : {
			methods : {
				post : async function (context) {
					let email = context.payload.email;

					if (email === null) {
						context.log.exception.invalid_request.throw();
					}

					let user = await context.data.find.User({ 'login.email' : email.trim().toLowerCase() });

					if (!user || user.meta.deleted != null) {
						context.log.exception.user_not_found.throw();
					}

					if (user.login.state === 'inactive') {
						context.log.exception.inactive_user.throw();
					}

					if (user.login.state === 'removed') {
						context.log.exception.removed_user.throw();
					}

					let gpassword = context.utils.security.getRandomPassword();
					let mpassword = md5(gpassword.toLowerCase());

					user.meta = user.meta || {};
					user.meta.generated_password = mpassword;
					user.markModified('meta');
					await user.persist();

					let fullName = user.first_names + ' ' + user.last_names;

					try {
						await context.smtp({
							to      : fullName + ' <' + user.login.email + '>',
							subject : 'Cambio de Contraseña',
							html    : 'Hola ' + fullName + '<br><br>' +
								'Se ha hecho una solicitud para actualizar tu contraseña.<br><br>' +
								'Para ingresar a tu perfil de usuario, utiliza el siguiente acceso generado de manera temporal:<br><br>' +
								'Correo: <b>' + user.login.email + '</b><br>' +
								'Contraseña: <b>' + gpassword + '</b><br><br>' +
								'Una vez accedas a tu cuenta, actualiza tus credenciales con una nueva contraseña.'
						}).send();
					} catch (err) {
						context.log.exception.smtp_error.args(err).throw();
					}

					context.ok();
				}
			},
		},
		user     : {
			methods : {
				/**
				 * @swagger
				 * /auth/user:
				 *   post:
				 *     description: Login a user and get the JWT token
				 *     tags: [Auth]
				 *     parameters:
				 *        - name: type
				 *          type: string
				 *          in: query
				 *          required: true
				 *          description: The type of auth
				 *     security: []
				 *     requestBody:
				 *       required: true
				 *       content:
				 *         application/json:
				 *           schema:
				 *             $ref: '#/components/schemas/AuthPayload'
				 *     responses:
				 *       200:
				 *         description: The user session was created
				 */
				post : async function (context) {
					let credentials = context.payload;

					let authType = 'email';
					let email = credentials.email ? credentials.email.trim().toLowerCase() : null;

					if (email === null) {
						context.log.exception.invalid_request.throw();
					}

					let user = await getUserData({
						context : context,
						email   : email
					});

					if (user == null && authType === 'social') {
						user = context.data.create.User({
							first_names : credentials.first_names,
							last_names  : credentials.last_names,
							role        : 'client',
							login       : {
								provider : credentials.provider,
								email    : credentials.email.trim().toLowerCase(),
								password : credentials.id != null ? md5('s' + credentials.id) : null,
								state    : 'active',
								date     : anxeb.utils.date.utc().unix(),
								token    : credentials.token,
							},
							info        : {},
							meta        : {
								created : anxeb.utils.date.utc().unix(),
								headers : anxeb.utils.data.copy(context.req.headers),
								social  : credentials
							}
						});

						let validated = await user.using(context).getSocialValidation(credentials);

						if (!validated) {
							context.log.exception.invalid_credentials.throw({ next : context.next, silent : true });
						}

						const helper = user.using(context);
						const $user = await helper.getUserWithContactId()

						await $user.persist();

						if (credentials.photo) {
							try {
								let res = await context.socket.do.get({ uri : credentials.photo, resolveWithFullResponse : true, encoding : null });
								if (res.statusCode === 200) {
									let imgData = 'data:' + res.headers['content-type'] + ';base64,' + Buffer.from(res.body).toString('base64');
									context.service.storage.save(anxeb.utils.path.join('avatars', 'users', $user._id.toString() + '.base64'), imgData);
								}
							} catch (err) { }
						}

						const response = await helper.getAuthResponse();
						response.message = await helper.sendSocialWelcomeEmail();

						context.send(response);

					} else if (user != null) {
						let login = user.login;

						let validated = false;
						let provider = 'email';

						if (authType === 'social') {
							provider = credentials.provider;
							validated = await user.using(context).getSocialValidation(credentials);
						} else if (credentials.password != null) {
							let password = credentials.password ? credentials.password.trim() : null;
							let mpassword = md5(password.trim().toLowerCase());

							let npassValid = login.password === mpassword;
							let gpassValid = user.meta && user.meta.generated_password === mpassword;

							validated = password && password.length && (npassValid || gpassValid);
							if (gpassValid) {
								user.login.password = user.meta.generated_password;
								await user.persist();
							}
						}

						if (!validated) {
							context.log.exception.invalid_credentials.throw({ next : context.next, silent : true });
							return;
						}

						if (login.state === 'inactive') {
							context.log.exception.inactive_user.throw();
						}

						if (login.state === 'removed') {
							context.log.exception.removed_user.throw();
						}

						const response = await user.using(context).getAuthResponse({
							changes : function (user) {
								user.login.provider = provider;
								if (user.login.state !== 'removed') {
									user.login.state = 'active';
								}
								user.login.date = anxeb.utils.date.utc().unix();
								user.meta.headers = anxeb.utils.data.copy(context.req.headers);
								if (authType === 'social') {
									user.meta.social = credentials;
								}
								user.markModified('meta');
							}
						});

						context.send(response);

					} else {
						if (authType === 'social') {
							context.log.exception.user_not_registered.throw({ next : context.next, silent : true });
						} else {
							context.log.exception.user_not_found.throw({ next : context.next, silent : true });
						}
					}
				}
			},
		},
		confirm  : {
			access  : anxeb.Route.access.private,
			owners  : '*',
			roles   : '*',
			methods : {
				post : async function (context) {
					let body = context.bearer.auth.body;

					let user = await getUserData({
						context : context,
						id      : ObjectId(body.identity)
					});

					if (!user || user.meta.deleted != null) {
						context.log.exception.user_not_found.throw();
					}

					let login = user.login;

					let password = context.payload.password ? context.payload.password.trim() : null;
					let validated = password && password.length && login.password === md5(password.trim().toLowerCase());

					if (!validated) {
						context.log.exception.invalid_password.throw();
					}

					if (user.state === 'inactive') {
						context.log.exception.inactive_user.throw();
					}

					const response = await user.using(context).getAuthResponse();

					context.send(response);
				}
			}
		},
		renew    : {
			access  : anxeb.Route.access.private,
			owners  : '*',
			roles   : '*',
			methods : {
				post : async function (context) {
					let user = await getUserData({
						context : context,
						id      : ObjectId(context.bearer.auth.body.identity)
					});

					if (!user || user.meta.deleted != null) {
						context.log.exception.user_not_found.throw();
					}

					if (user.login.state === 'inactive') {
						context.log.exception.user_not_found.throw();
					}

					if (user.login.state === 'removed') {
						context.log.exception.removed_user.throw();
					}

					const response = await user.using(context).getAuthResponse();

					context.send(response);
				}
			}
		},
		language : {
			access  : anxeb.Route.access.private,
			owners  : '*',
			roles   : '*',
			methods : {
				post : async function (context) {
					let body = context.bearer.auth.body;

					let user = await getUserData({
						context : context,
						id      : ObjectId(body.identity)
					});

					if (!user || user.meta.deleted != null) {
						context.log.exception.user_not_found.throw();
					}

					if (user.login.state === 'inactive') {
						context.log.exception.inactive_user.throw();
					}

					if (user.login.state === 'removed') {
						context.log.exception.removed_user.throw();
					}

					if (context.payload.language == null || context.payload.language.length === 2) {
						user.info = user.info || {};
						user.info.language = context.payload.code;
						user.markModified('info');
						user.persist();
						context.ok();
					} else {
						context.log.exception.invalid_request.throw();
					}
				}
			}
		},
		tokenize : {
			access  : anxeb.Route.access.private,
			owners  : '*',
			roles   : '*',
			methods : {
				post : async function (context) {
					let user = await getUserData({
						context : context,
						id      : ObjectId(context.bearer.auth.body.identity)
					});

					if (!user || user.meta.deleted != null) {
						context.log.exception.user_not_found.throw();
					}

					if (user.login.state === 'inactive') {
						context.log.exception.inactive_user.throw();
					}

					if (user.login.state === 'removed') {
						context.log.exception.removed_user.throw();
					}

					if (context.payload.token == null || context.payload.token === '') {
						user.login.token = null;
					} else {
						user.login.token = context.payload.token;
					}

					user.persist();
					context.ok();
				}
			}
		},
		close    : {
			owners  : '*',
			roles   : '*',
			methods : {
				post : async function (context) {
					if (!context.payload.user) {
						context.log.exception.invalid_request.throw();
					}
					const user = await context.data.retrieve.User(ObjectId(context.payload.user));

					if (!user || user.meta.deleted != null) {
						context.log.exception.user_not_found.throw();
					}

					if (user.login.token != null) {
						user.login.token = null;
						user.persist();
					}

					context.ok();
				}
			}
		},
		remove   : {
			access  : anxeb.Route.access.private,
			owners  : '*',
			roles   : '*',
			methods : {
				post : async function (context) {
					let email = context.payload.email;

					if (email === null) {
						context.log.exception.invalid_request.throw();
					}

					let user = await context.data.find.User({
						_id           : ObjectId(context.payload.id),
						'login.email' : email.trim().toLowerCase()
					});

					if (!user || user.meta.deleted != null || !user._id.equals(context.bearer.auth.body.identity)) {
						context.log.exception.user_not_found.throw();
					}

					user.login.state = 'removed';
					await user.persist();

					context.ok();
				}
			}
		}
	},
};

const getUserData = async function (params) {
	const context = params.context;
	const query = {};

	if (params.email != null) {
		query['login.email'] = params.email.trim().toLowerCase();
	} else if (params.id != null) {
		query._id = params.id;
	} else {
		return null;
	}

	query['meta.deleted'] = { $exists : false };
	return await context.data.find.User(query);
}