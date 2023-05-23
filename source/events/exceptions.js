'use strict';

let eventTypes = require('anxeb-node').Event.types;

module.exports = {
	inactive_user               : {
		message : 'Usuario inactivo, favor contactar su administrador',
		code    : 909,
		type    : eventTypes.user_exception
	},
	user_not_found              : {
		message : 'Usuario no encontrado',
		code    : 910,
		type    : eventTypes.user_exception
	},
	access_denied               : {
		message : 'Operación denegada por falta de permisos',
		code    : 911,
		type    : eventTypes.http_error
	},
	removed_user                : {
		message : 'Cuenta de usuario inactiva o eliminada',
		code    : 944,
		type    : eventTypes.user_exception
	},
	smtp_error                  : {
		message : "Error enviando correo. [inner]",
		code    : 922,
		type    : eventTypes.user_exception
	},
	invalid_credentials         : {
		message : 'Correo o contraseña incorrecta',
		code    : 901,
		type    : eventTypes.user_exception
	},
	user_not_registered         : {
		message : 'Usuario no registrado',
		code    : 906,
		type    : eventTypes.user_exception
	},
	prospect_account_registered : {
		message : 'La cuenta [0] ya está tomada, favor utilizar otro correo',
		code    : 916,
		type    : eventTypes.user_exception
	},
	invalid_email               : {
		message : 'Correo inválido',
		code    : 902,
		type    : eventTypes.user_exception
	},
	invalid_password            : {
		message : 'Contraseña Inválida',
		code    : 903,
		type    : eventTypes.user_exception
	},
	fixed_email                 : {
		message : 'Correo social no puede ser modificado',
		code    : 919,
		type    : eventTypes.user_exception
	},
	salesforce_error            : {
		message : '[0]',
		code    : 2211,
		type    : eventTypes.service_exception
	},
	calendar_error              : {
		message : '[0]',
		code    : 2211,
		type    : eventTypes.service_exception
	},
	selected_name_unavailable   : {
		message : '[0] seleccionado no está disponible',
		code    : 904,
		type    : eventTypes.user_exception
	},
	user_self_delete            : {
		message : 'No puede eliminar su propio usuario',
		code    : 905,
		type    : eventTypes.user_exception
	}
};