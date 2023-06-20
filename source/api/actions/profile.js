'use strict';
const anxeb = require('anxeb-node');
const md5 = require('md5');
const Imaging = require("../../middleware/imaging");

module.exports = {
	url     : '/profile',
	type    : anxeb.Route.types.action,
	access  : anxeb.Route.access.public,
	owners  : ['*'],
	roles   : ['*'],
	timeout : 60000,
	methods : {
		get  : async function (context) {
			let user = await context.retrieve.user();

			if (!user || user.meta.deleted != null) {
				context.log.exception.user_not_found.throw();
			}

			context.send({
				user  : user.toClient(),
				roles : context.profile.roles,
				type  : context.profile.type
			});
		},
		post : async function (context) {
			let payload = context.payload;

			let email = payload.email != null && payload.email.length > 0 ? payload.email.trim().toLowerCase() : null;
			let password_old = payload.password_old != null && payload.password_old.length > 0 ? payload.password_old.trim().toLowerCase() : null;
			let password_rep = payload.password_rep != null && payload.password_rep.length > 0 ? payload.password_rep.trim().toLowerCase() : null;
			let password_new = payload.password_new != null && payload.password_new.length > 0 ? payload.password_new.trim().toLowerCase() : null;

			if (email != null) {
				if (!anxeb.utils.email.validate(email)) {
					context.log.exception.invalid_email.include({
						fields : [{ name : 'email', index : 1 }]
					}).throw();
				}
			}

			let user = await context.retrieve.user();

			if (!user || user.meta.deleted != null) {
				context.log.exception.user_not_found.throw();
			}


			if (user.login.provider !== 'email' && email != null) {
				context.log.exception.fixed_email.include({
					fields : [{ name : 'email', index : 1 }]
				}).throw();
			}

			if (password_old && user.login.password !== md5(password_old)) {
				context.log.exception.invalid_password.throw();
			}

			if (password_new != null) {
				if (password_new.length < 4 || password_new.length > 18) {
					context.log.exception.invalid_password.include({
						fields : [{ name : 'password_new', index : 1 }]
					}).throw();
				}

				if (password_rep != null && password_rep !== password_new) {
					context.log.exception.invalid_password.include({
						fields : [{ name : 'password_rep', index : 1 }]
					}).throw();
				}

				user.login.password = md5(password_new);
			}

			if (email != null) {
				let rep_email = await context.data.find.User({ 'login.email' : email });

				if (rep_email && !rep_email._id.equals(user._id) && rep_email.meta.deleted != null) {
					context.log.exception.prospect_account_registered.args(email).include({
						fields : [{ name : 'email', index : 1 }]
					}).throw();
				}
				user.login.email = email;
			}

			await user.persist();
			context.send(user.toClient());
		}
	},
	childs  : {
		avatar : {
			methods : {
				get  : async function (context) {
					let identity = context.profile.identity;
					let resource = anxeb.utils.path.join('avatars', 'users', identity + '.base64');
					await Imaging.processFileRequest(context, resource);
				},
				post : async function (context) {
					if (context.payload.picture) {
						context.service.storage.save(anxeb.utils.path.join('avatars', 'users', context.profile.identity.toString() + '.base64'), context.payload.picture);
						context.ok();
					} else {
						context.log.exception.invalid_request.throw();
					}
				}
			}
		}
	}
};