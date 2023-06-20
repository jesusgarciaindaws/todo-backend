'use strict';

const fields = require('anxeb-mongoose').Fields;
const SchemaBuilder = require('../../../middleware/schema');

module.exports = {
	Schema : function (params) {
		return new SchemaBuilder(params, 'Sequence').build((builder) => ({
			entity   : fields.reference(),
			counters : fields.mixed({ required : true }),
		}));
	}
};