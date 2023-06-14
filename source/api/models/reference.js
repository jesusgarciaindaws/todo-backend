'use strict';

const Reference = require('../schemas/primary/reference');

module.exports = {
	collection : 'References',
	schema     : new Reference.Schema(),
	methods    : {
		toClient : function (childs) {
			return {
				id     : this._id,
				name   : this.name,
				type   : this.type,
				meta   : this.meta,
				parent : this.parent && this.parent.toClient ? this.parent.toClient() : this.parent,
				root   : this.root && this.root.toClient ? this.root.toClient() : this.root,
				childs : this.childs || (childs && childs.toClient ? childs.toClient() : childs),
			};
		},
	}
};