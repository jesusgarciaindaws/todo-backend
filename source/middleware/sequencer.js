'use strict';
let ObjectId = require('anxeb-mongoose').ObjectId;

module.exports = function (context, entity) {
	let _context = context;

	let _entity = entity;
	return {
		last      : async function (params) {
			let $counter = params.counter;
			let $increment = params.increment;
			let $initial = params.initial != null ? params.initial : 1000;

			let sequence = await _context.data.find.Sequence({
				entity : _entity != null ? ObjectId(_entity) : null,
			});

			if (sequence == null) {
				let counters = {};
				counters[$counter] = $initial;
				sequence = _context.data.create.Sequence({
					entity   : _entity,
					counters : counters
				});
				await sequence.persist();
				return $initial;
			} else {
				let value = sequence.counters[$counter];

				if (value == null) {
					sequence.counters[$counter] = $initial;
					sequence.markModified('counters');
					await sequence.persist();
					return $initial;
				} else if ($increment) {
					let newValue = value + 1;
					sequence.counters[$counter] = newValue;
					sequence.markModified('counters');
					await sequence.persist();
					return newValue;
				}
			}

			return sequence.counters[$counter];
		},
		increment : async function (params) {
			return await this.last({
				counter   : params.counter,
				initial   : params.initial,
				increment : true
			});
		}
	}
};