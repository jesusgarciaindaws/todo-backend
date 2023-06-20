'use strict';

const Sequence = require('../schemas/primary/sequence');

module.exports = {
	collection : 'Sequences',
	schema     : new Sequence.Schema(),
	methods    : {
		toClient : function () {
			return {
				id       : this._id,
				entity   : this.entity,
				counters : this.counters
			}
		}
	}
};