'use strict';

const fields = require('anxeb-mongoose').Fields;
const SchemaBuilder = require('../../../middleware/schema');

module.exports = {
	Schema : function (params) {
		return new SchemaBuilder(params, 'Task').build((builder) => ({
			name 		: fields.string({ required : true }),
			description : fields.string({ required : true }),
		}));
	}
};