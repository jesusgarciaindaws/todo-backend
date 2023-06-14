'use strict';

const fields = require('anxeb-mongoose').Fields;
const SchemaBuilder = require('../../../middleware/schema');

module.exports = {
	Schema : function (params) {
		return new SchemaBuilder(params, 'File').build(function (required) {
			return {
				name      : fields.string({ required : true }),
				title     : fields.string({ required : true }),
				mime      : fields.string({ required : true }),
				extension : fields.string({ required : true }),
				size      : fields.number({ required : true }),
				type      : fields.enum({ required : true }, ['document', 'image']),
				meta      : fields.mixed(),
				created   : fields.number({ required : true }),
				owner     : {
					entity : fields.string({ required : true }),
					type   : fields.enum({ required : true }, ['Rule', 'Payment', 'Coworking'])
				},
				user      : fields.reference({ required : false }, 'User'),
			};
		});
	}
};