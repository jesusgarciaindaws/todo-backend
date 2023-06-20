'use strict';

const fields = require('anxeb-mongoose').Fields;
const SchemaBuilder = require('../../../middleware/schema');

module.exports = {
	Schema : function (params) {
		return new SchemaBuilder(params).build((builder) => ({
			provider : fields.enum({ required : true }, ['email', 'facebook', 'google', 'apple']),
			email    : fields.string({ required : true, index : true }),
			password : fields.string({ required : true }),
			state    : fields.enum({ required : true }, ['active', 'inactive', 'unconfirmed', 'removed']),
			date     : fields.number(),
			token    : fields.string()
		}));
	}
};