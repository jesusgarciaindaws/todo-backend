'use strict';

const crypto = require("crypto");
const anxeb = require("anxeb-node");

module.exports = function (context) {
	return {
		store    : {
			images : function (params) {
				return new Promise(function (resolve, reject) {
					if (params.payload == null) {
						resolve();
						return;
					}

					for (let i = 0; i < params.allow.length; i++) {
						const key = params.allow[i];
						let filename = anxeb.utils.path.join(params.root, params.id.toString(), key + '.base64');
						let fitem = params.payload[key];
						let absPath = context.service.locate.storage(filename);

						if (fitem === null) {
							if (anxeb.utils.file.exists(absPath)) {
								anxeb.utils.fs.unlinkSync(absPath);
							}
						} else if (fitem != null && fitem.length > 0) {
							context.service.storage.save(filename, fitem);
						}
					}
					resolve();
				});
			},
		},
		security : {
			getRandomNumber   : function (min, max) {
				return Math.floor(Math.random() * (max - min + 1) + min);
			},
			getRandomPassword : function () {
				let prefix = String.fromCharCode(this.getRandomNumber(65, 90));
				if (prefix === 'I' || prefix === 'O' || prefix === 'L' || prefix === '0') {
					prefix = 'Z';
				}
				prefix = prefix.toUpperCase();
				return prefix + this.getRandomNumber(100000, 999999).toString();
			},
			buildHash         : function (keys, algorithm, options) {
				const hasher = crypto.createHash(algorithm || 'sha256', options);
				for (let i = 0; i < keys.length; i++) {
					hasher.update(keys[i], 'utf8');
				}
				return hasher.digest();
			},
		},
		query    : {
			setDateRangeQuery : function (query) {
				const minutesOffset = context.req.headers['tz-offset'] != null ? parseInt(context.req.headers['tz-offset']) : 0;
				let $year = context.query.year && context.query.year.length > 0 ? parseInt(context.query.year) : null;
				let $month = context.query.month && context.query.month.length > 0 ? parseInt(context.query.month) : null;

				let from;
				let to;

				if ($year != null && $month != null) {
					let period = anxeb.utils.moment([$year, $month - 1]);
					from = anxeb.utils.moment(period).startOf('month');
					to = anxeb.utils.moment(period).endOf('month');
				} else if (context.query.date != null && context.query.date.length > 0) {
					from = anxeb.utils.moment.unix(parseInt(context.query.date)).utcOffset(minutesOffset).startOf('day');
					to = anxeb.utils.moment.unix(parseInt(context.query.date)).utcOffset(minutesOffset).endOf('day');
				} else if (context.query.today === 'true') {
					from = anxeb.utils.moment().utcOffset(minutesOffset).startOf('day');
					to = anxeb.utils.moment().utcOffset(minutesOffset).endOf('day');
				} else if (context.query.recent === 'true') {
					from = anxeb.utils.moment().utcOffset(minutesOffset).add(-24, 'hours');
					to = anxeb.utils.moment().utcOffset(minutesOffset).endOf('day');
				}

				if (from != null && to != null) {
					let fromTick = from.utc().unix();
					let toTick = to.utc().unix();
					query['dates.created'] = { "$gte" : fromTick, "$lt" : toTick };
				}
			},
			build             : function (context, query, fields, hasMeta) {
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

				if (hasMeta === true) {
					result['meta.deleted'] = { $exists : false }
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
			paging            : function (context, query, fields) {
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
		},
	};
}