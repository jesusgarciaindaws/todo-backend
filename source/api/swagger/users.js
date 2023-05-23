module.exports = {
	User        : {
		type       : 'object',
		properties : {
			id          : {
				type : 'string'
			},
			first_names : {
				type : 'string'
			}
		}
	},
	UserList    : {
		type  : 'array',
		items : {
			$ref : '#/components/schemas/User'
		}
	},
	UserPayload : {
		type       : 'object',
		properties : {
			first_names : {
				type : 'string'
			}
		}
	},
};