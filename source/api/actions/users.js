'use strict';

const anxeb = require('anxeb-node');
const md5 = require('md5');

module.exports = {
	url     : '/users',
	type    : anxeb.Route.types.action,
	access  : anxeb.Route.access.public,
	roles   : {
		get    : ['system_admin'],
		put    : ['system_admin'],
		delete : ['system_admin'],
		post   : ['system_admin']
	},
	timeout : 60000,
	methods : {
		get  : async function (context) {
			let query = context.utils.query.build(context, {}, ['first_names', 'last_names', 'login.email'], true);
			let populate = null;

			const users = await context.data.list.User(query, populate);
			context.send(users.toClient());
		},
		post : async function (context) {
			let form = context.payload.user;
			let images = context.payload.images;

			if (form.login.email != null) {
				let rep_email = await context.data.find.User({ 'login.email' : form.login.email.trim().toLowerCase(), 'meta.deleted' : { $exists : false } });
				if (rep_email && !rep_email._id.equals(form.id)) {
					context.log.exception.selected_name_unavailable.args('Correo').include({
						fields : [{ name : 'login.email', index : 1 }]
					}).throw();
				}
			}

			let user = await context.data.upsert.User(form.id);
			form.login.email = form.login.email ? form.login.email.trim().toLowerCase() : user.login.email;

			if (form.login.password && (form.login.password.trim().length < 4 || form.login.password.trim().length > 18)) {
				context.log.exception.invalid_password.include({
					fields : [{ name : 'login.password', index : 1 }]
				}).throw();
			}

			let password = form.login.password ? md5(form.login.password.trim().toLowerCase()) : null;
			form.login.password = password || user.login.password;
			form.login.provider = password != null || !form.id ? 'email' : user.login.provider;

			if (!user.isNew && user.meta.deleted != null) {
				delete user.meta.deleted;
				user.markModified('meta');
			}

			anxeb.utils.data.populate(user, form);

			user.role = (form.role ? form.role : user.role) || 'admin';
			user.owner = form.owner?.type && form.owner?.entity ? form.owner : null;

			if (user.isNew) {
				user.meta = {
					created : anxeb.utils.date.utc().unix(),
					parent  : context.profile.identity,
					...(user.meta || {})
				};
				user.markModified('meta');
			}

			if (form.meta) {
				user.meta.contact_id = form.meta.contact_id;
				user.markModified('meta');
			}

			await user.persist();

			if (images) {
				if (images.avatar) {
					context.service.storage.save(anxeb.utils.path.join('avatars', 'users', user._id.toString() + '.jpg'));
				}
			}

			context.send(user.toClient());
		}
	},
	childs  : {
		item : {
			url     : '/:userId',
			methods : {
				get    : async function (context) {
					let user = await context.data.retrieve.User(context.params.userId);
					if (!user || user.meta.deleted != null) {
						context.log.exception.record_not_found.args('Usuario', context.params.userId).throw();
					}
					context.send(user.toClient());
				},
				delete : async function (context) {
					let user = await context.data.retrieve.User(context.params.userId);
					if (!user || user.meta.deleted != null) {
						context.log.exception.record_not_found.args('Usuario', context.params.userId).throw();
					}

					if (user._id.equals(context.profile.identity)) {
						context.log.exception.user_self_delete.throw();
					}

					user.meta.deleted = anxeb.utils.date.utc().unix();
					user.markModified('meta');
					await user.persist();
					context.ok();
				}
			}
		}
	}
};