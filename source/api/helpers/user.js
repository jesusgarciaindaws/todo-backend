'use strict';
const anxeb = require('anxeb-node');
const md5 = require('md5');

module.exports = function (context, user) {
	const _context = context;
	const _user = user;

	return {
		getAuthResponse : async function ( params) {
			const self = this;
			_user.login.date = anxeb.utils.date.utc().unix();
			let $user = _user.toClient();
			_context.data.retrieve.User(_user._id || _user.id).then(function(user) {
				user.login.date = anxeb.utils.date.utc().unix();
				if (params.changes){
					params.changes(user);
				}
				user.persist();
			}).catch(function (err) {});

			let $type = $user.role === 'admin' ? 'system' : 'app';
			let $roles = ['${$type}.${$user.role}'];
			return {
				user: $user,
				roles: $roles,
				provider: $user.login.provider,
				token: context.sign({
					user: {
						id: $user.id,
						first_names: $user.first_names,
						email: $user.login.email.trim().toLowerCase(),
						role: $user.role,
					},
					identity: $user.id,
					claims: [],
					roles: $roles,
					type: $type,
				}),
				flags: {},
			}
		}
	}
};