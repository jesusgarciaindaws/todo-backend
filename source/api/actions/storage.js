'use strict';
let anxeb = require('anxeb-node');
let Imaging = require('../../middleware/imaging');

module.exports = {
	type    : anxeb.Route.types.action,
	access  : anxeb.Route.access.public,
	owners  : ['*'],
	roles   : ['*'],
	timeout : 60000,
	url     : '/storage',
	childs  : {
		profile     : {
			url     : '/profile/avatar',
			methods : {
				get : async function (context) {
					let identity = context.profile.identity;
					let resource = anxeb.utils.path.join('avatars', 'users', identity + '.base64');
					await Imaging.processFileRequest(context, resource);
				}
			}
		},
		user_avatar : {
			url     : '/users/:userId/avatar',
			methods : {
				get : async function (context) {
					let identity = context.params.userId;
					let resource = anxeb.utils.path.join('avatars', 'users', identity + '.base64');
					await Imaging.processFileRequest(context, resource);
				}
			}
		}
	}
};