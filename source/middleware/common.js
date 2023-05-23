'use strict';

module.exports = {
	query : {
		build  : function (context, query, fields) {
			let result = query || {};

			if (context.query.lookup) {
				if (fields != null) {
					let orr = [];
					for (let i = 0; i < fields.length; i++) {
						let field = fields [i];
						let item = {};
						item[field] = {
							$regex   : context.query.lookup,
							$options : 'i'
						};
						orr.push(item);
					}
					result.$and = [{ $or : orr }];
				} else {
					result.$and = [{
						$or : [{
							name : {
								$regex   : context.query.lookup,
								$options : 'i'
							}
						}, {
							code : {
								$regex   : context.query.lookup,
								$options : 'i'
							}
						}, {
							reference : {
								$regex   : context.query.lookup,
								$options : 'i'
							}
						}]
					}];
				}
			}

			if (query != null) {
				for (let item in query) {
					if (query[item] === undefined) {
						delete query[item];
					}
				}
			}
			return result;
		},
		paging : function (context, query, fields) {
			let _self = this;
			let _sort;
			let _active = false;

			if (context.query.page && context.query.limit) {
				_active = true;
			}

			if (context.query.sort) {
				_sort = {};
				if (context.query.desc) {
					_sort[context.query.sort] = -1;
				} else {
					_sort[context.query.sort] = 1;
				}
			} else {
				_sort = undefined;
			}

			return {
				sort   : _sort,
				active : _active,
				page   : _active ? parseInt(context.query.page) : null,
				limit  : _active ? parseInt(context.query.limit) : null,
				query  : _self.build(context, query, fields)
			};
		}
	}
};