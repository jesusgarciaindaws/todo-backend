'use strict';

const File = require('../schemas/primary/file');
const Helper = require('../helpers/file');

module.exports = {
	collection : 'Files',
	schema     : new File.Schema(),
	methods    : {
		toClient : function () {
			return {
				id        : this._id,
				name      : this.name,
				title     : this.title,
				mime      : this.mime,
				extension : this.extension,
				size      : this.size,
				type      : this.type,
				created   : this.created,
				user      : this.user && this.user.toClient ? this.user.toClient() : this.user,
				meta      : this.meta
			};
		},
		using    : function (context) {
			return new Helper(context, this);
		}
	}
};