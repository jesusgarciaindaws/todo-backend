'use strict';

const fields = require('anxeb-mongoose').Fields;
const SchemaBuilder = require('../../../middleware/schema');

module.exports = {
	Schema : function (params) {
		return new SchemaBuilder(params, 'Reference').build(function (required) {
			return {
				name   : fields.string({ required : true, index : true, text : true }),
				type   : fields.enum({ required : true }, ['country', 'country_state', 'state_city', 'configuration']),
				meta   : fields.mixed(),
				parent : fields.reference({ index : true }, 'Reference'),
				root   : fields.reference('Reference'),
			};
		});
	}
};