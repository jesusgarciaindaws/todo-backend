'use strict';

const fields = require('anxeb-mongoose').Fields;
const SchemaBuilder = require('../../../middleware/schema');
const Login = require('../common/login');

module.exports = {
	Schema : function (params) {
		return new SchemaBuilder(params, 'User').build((builder) => ({
			name : fields.string({ required : true }),
			role : fields.enum({required : true}, ['admin', 'client']),
			login : new Login.Schema({required: true, static : true}), 
			info :fields.mixed(),
			meta : fields.mixed(),
		}));
	}
};