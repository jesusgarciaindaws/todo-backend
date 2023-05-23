'use strict';

let eventTypes = require('anxeb-node').Event.types;

module.exports = {
	data_validation_exception : {
		message : 'Uno o varios campos son requeridos en la solicitud',
		code    : 8005,
		type    : 'data_exception'
	},
	page_not_found            : {
		message : 'Recurso [1:w]:[0:w] no encontrado',
		code    : 404,
		type    : eventTypes.http_error
	},
	request_timeout           : {
		message : 'Tiempo de espera excedido',
		code    : 408,
		type    : eventTypes.http_error
	},
	unauthorized_access       : {
		message : 'Acceso no autorizado a [0:w]:[1:w]',
		code    : 401,
		type    : eventTypes.http_error
	},
	denied_access             : {
		message : 'Accedo denegado a [1]',
		code    : 401,
		type    : eventTypes.http_error
	},
};