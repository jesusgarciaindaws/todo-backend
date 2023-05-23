'use strict';

const User = require('../schemas/primary/user');
const Helper = require("../helpers/user");

module.exports = {
	collection : 'Users',
	schema     : new User.Schema(),
	methods    : {
		toClient : function () {
			return {
				id          : this._id,
				first_names : this.first_names,
			}
		},
		using    : function (context) {
			return new Helper(context, this)
		},
	}
};