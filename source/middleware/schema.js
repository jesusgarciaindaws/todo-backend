'use strict';
const fields = require('anxeb-mongoose').Fields;

module.exports = function (params, modelName) {
	let _self = this;
	let _modelName = modelName;
	let _isStatic = params && params.static === true || false;
	let _required = (params == null || params.required == null) ? false : params.required;
	let _root = !_isStatic && _modelName != null;

	_self.build = function (buildSchema) {
		let $schema = buildSchema(_self);
		if (_isStatic) {
			$schema._id = false;
			if (_modelName != null) {
				$schema.id = fields.reference({ required : true }, _modelName);
			}
		}

		return (_isStatic || _root) ? $schema : (_required != null ? fields.mixed({ required : _required }, $schema) : $schema);
	}

	return _self;
};