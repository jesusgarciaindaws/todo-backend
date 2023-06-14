'use strict';

const anxeb = require('anxeb-node');
const utils = require('../../middleware/utils');

module.exports = {
	url     : '/files',
	type    : anxeb.Route.types.action,
	access  : anxeb.Route.access.public,
	owners  : '*',
	roles   : {
		get : ['*'],
	},
	timeout : 1800000,
	methods : {
		get : async function (context) {
			let query = utils.query.build(context, {}, ['name', 'title']);
			let populate = [];

			if (context.query.entityId) {
				query['owner.entity'] = context.query.entityId;
			} else if (context.query.entities) {
				query['owner.entity'] = { $in : context.query.entities };
			}

			if (context.query.meta) {
				let metaFilter = JSON.parse(context.query.meta);
				for (let key in metaFilter) {
					query['meta.' + key] = metaFilter[key];
				}
			}

			let files = await context.data.list.File(query, populate);
			context.send(files.toClient());
		},
	},
	childs  : {
		item : {
			url     : '/:fileId',
			methods : {
				get : async function (context) {
					let file = await context.data.retrieve.File(context.params.fileId);
					if (file) {
						context.send(file.toClient());
					} else {
						context.log.exception.record_not_found.args('Archivo', context.params.fileId).throw(context);
					}
				},
			},
			childs  : {
				download : {
					methods : {
						get : async function (context) {
							let file = await context.data.retrieve.File(context.params.fileId);
							if (!file) {
								context.log.exception.record_not_found.args('Archivo', context.params.fileId).throw(context);
							}
							await file.using(context).process({ output : 'download' });
						}
					},
				},
				open     : {
					methods : {
						get : async function (context) {
							let file = await context.data.retrieve.File(context.params.fileId);
							if (!file) {
								context.log.exception.record_not_found.args('Archivo', context.params.fileId).throw(context);
							}
							await file.using(context).process({ output : 'open' });
						}
					}
				},
				preview  : {
					methods : {
						get : async function (context) {
							let file = await context.data.retrieve.File(context.params.fileId);
							if (!file) {
								context.log.exception.record_not_found.args('Archivo', context.params.fileId).throw(context);
							}
							await file.using(context).process({ output : 'preview' });
						}
					},
				},
			}
		}
	}
};