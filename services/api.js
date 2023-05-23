'use strict';

const environment = require(`../environments/${process.env.NODE_ENV || 'development'}`).api;
const project = require('../package');
const swaggerSchemas = require('../source/api/swagger/index');

module.exports = {
	domain     : 'api.todo.com',
	name       : 'To-do Api',
	version    : `v${project.version}`,
	key        : 'api',
	active     : true,
	settings   : {
		log      : {
			identifier : '[service_name]',
			enabled    : true,
			stack      : process.env.NODE_ENV === 'development',
			file       : '[logs_path]/api/[year]/[month_name]/[day].log',
			events     : ['[source_path]/events']
		},
		socket   : environment.socket,
		routing  : {
			routes  : ['[source_path]/api/actions'],
			cors    : environment.socket.cors,
			upload  : true,
			base    : function (context) {
				context.next();
			},
			parsers : {
				raw  : true,
				json : true,
				url  : true
			},
			swagger : {
				url      : '/help',
				document : {
					definition : {
						openapi    : '3.0.0',
						info       : {
							title       : `${project.name} API`,
							version     : project.version,
							description : project.description,
						},
						components : {
							schemas         : swaggerSchemas,
							securitySchemes : {
								jwt : {
									type         : 'http',
									scheme       : 'bearer',
									in           : 'header',
									bearerFormat : 'JWT'
								}
							}
						},
						security   : [{ jwt : [] }]
					},
					apis       : ['[source_path]/api/actions/*.js']
				},
				options  : {
					explorer : true
				}
			},
			context : {
				properties : {
					profile  : function (context) {
						return (context.bearer && context.bearer.auth ? context.bearer.auth.body : null);
					},
					retrieve : function (context) {
						return {
							user : async function () {
								return await context.data.retrieve.User(context.profile.identity);
							}
						}
					},
					utils    : require('../source/middleware/utils'),
				},
				methods    : {
					sequencer : require('../source/middleware/sequencer'),
					smtp      : require('../source/middleware/smtp')(environment.smtp),
				}
			}
		},
		renderer : {
			static  : ['[source_path]/api/static'],
			favicon : '[source_path]/api/static/favicon.png',
		},
		storage  : {
			sub_folder : null
		},
		security : environment.security,
		i18n     : {
			locales   : ['en', 'es'],
			directory : '[source_path]/locales',
			default   : 'es',
			header    : 'accept-language'
		}
	},
	extensions : {
		mongoose : {
			connection : environment.mongodb,
			models     : ['[source_path]/api/models']
		}
	},
	initialize : function (service, application) {
	}
};