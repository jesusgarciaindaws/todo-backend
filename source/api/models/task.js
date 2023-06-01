'use strict';

const Task = require('../schemas/primary/task');
const Helper = require("../helpers/task");

module.exports = {
	collection : 'Tasks',
	schema     : new Task.Schema(),
	methods    : {
		toClient : function () {
			return {
				id          : this._id,
			}
		},
		toClientDetailed : function () {
			return {
				id          : this._id,
				task : this.task,
			}
		},
		using    : function (context) {
			return new Helper(context, this)
		},
	}
};