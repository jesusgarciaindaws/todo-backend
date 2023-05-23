module.exports = {
	type : 'development',
	api  : {
		socket   : {
			host : `localhost`,
			port : 6401,
			cors : {
				origin         : '*',
				exposedHeaders : []
			}
		},
		security : {
			session : {
				name   : 'info.todo',
				secret : 'fdsg98w04m4y8wyer0h,',
				resave : false,
				redis  : true
			},
			keys    : {
				private    : '/development.rsa',
				public     : '/development.pem',
				expiration : 80000
			}
		},
		mongodb  : {
			key          : 'todo-dev-db',
			uri          : 'mongodb://localhost:27017/todo-dev?w=majority&readPreference=primary&retryWrites=true&directConnection=true&ssl=false',
			options      : {
				autoReconnect      : false,
				useUnifiedTopology : true,
				keepAlive          : 2000,
				poolSize           : 4,
				useFindAndModify   : false
			},
			retryTimeout : 2592000
		},
		smtp     : {
			account : 'To-do <info@todo.com>',
			host    : 'smtp.ethereal.email',
			port    : 587,
			secure  : false,
			auth    : {
				user : 'bcbwkcnlkwhbencz@ethereal.email',
				pass : 'dktVT2dDBuYuWkKG3h'
			}
		}
	},
}