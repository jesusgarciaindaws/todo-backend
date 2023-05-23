'use strict';

const anxeb = require('anxeb-node');
const moment = anxeb.utils.moment;
const puppeteer = require('puppeteer');

const $isNull = function (value) {
	if (value != null && typeof value === 'object') {
		if (value.hasOwnProperty('name') &&
			value.hasOwnProperty('hash') &&
			value.hasOwnProperty('data')) {
			return true;
		}
	}
	return value == null;
};

const $default = function (value, def) {
	if (value != null) {
		if ($isNull(value)) {
			return def;
		}
		return value;
	}
	return def;
};

module.exports = function (context, params) {
	let _self = this;
	let _context = context;
	let _templatesPath = params.templates;
	let _storagePath = params.storage;
	let _scripts = params.scripts;

	let _helpers = {
		html    : function (context, params, data) {
			return function (value) {
				if ($isNull(value)) {
					return null;
				}
				let translate_re = /&(nbsp|amp|quot|lt|gt);/g;
				let translate = {
					"nbsp" : " ",
					"amp"  : "&",
					"quot" : "\"",
					"lt"   : "<",
					"gt"   : ">"
				};
				return value == null ? '' : value.replace(translate_re, function (match, entity) {
					return translate[entity];
				}).replace(/&#(\d+);/gi, function (match, numStr) {
					let num = parseInt(numStr, 10);
					return String.fromCharCode(num);
				});
			}
		},
		divide  : function (context, params, data) {
			return function (a, b) {
				return anxeb.utils.money.normalize(a / b);
			}
		},
		now     : function (context, params, data) {
			return function () {
				return moment();
			}
		},
		bool    : function (context, params, data) {
			return function (value, ifTrue, ifFalse) {
				if (value === true) {
					return ifTrue;
				} else {
					if ($isNull(ifFalse)) {
						return null;
					} else {
						return ifFalse;
					}
				}
			}
		},
		if      : function (context, params, data) {
			return function () {
				let values = Array.prototype.slice.call(arguments);
				let opts = arguments[values.length - 1];
				let value = arguments[0];

				for (let i = 1; i < values.length - 1; i++) {
					if (value == values[i]) {
						return opts.fn(this);
					}
				}
				return opts.inverse(this);
			}
		},
		greater : function (context, params, data) {
			return function (value, comp, opts) {
				if ($isNull(value)) {
					return false;
				}
				if (value > comp) {
					return opts.fn(this);
				}
				return opts.inverse(this);
			}
		},
		integer : function (context, params, data) {
			return function (value, comma) {
				let thousandComma = $isNull(comma) ? true : comma;
				if (value == null) {
					value = 0;
				}
				value = parseFloat(value).toFixed(2);

				let pind = value.indexOf('.');
				if (pind > -1) {
					value = value.substring(0, pind);
				}

				if (thousandComma === true) {
					value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
				}

				return value
			}
		},
		number  : function (context, params, data) {
			return function (value, decimals, comma) {
				let decimalCount = $isNull(decimals) ? 2 : decimals;
				let thousandComma = $isNull(comma) ? true : comma;

				if (value == null) {
					value = 0;
				}

				value = parseFloat(value).toFixed(decimalCount);

				if (thousandComma === true) {
					value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
				}

				return value
			}
		},
		date    : function (context, params, data) {
			return function (value, option) {
				if ($isNull(value)) {
					return null;
				}
				option = $default(option, 'normal');

				let _formats = {
					normal : "DD/MM/YYYY",
					text   : "DD MMMM [del] YYYY",
					long   : "DD/MM/YYYY hh:mm a",
					time   : "h:mm a"
				};

				let date = null;

				if (typeof value === 'number') {
					date = moment.unix(value);
				} else {
					date = moment(value);
				}

				let format = _formats[option] || option;


				if (option === 'month-number') {
					return (date.month() + 1);
				} else if (option === 'month-index') {
					return date.month();
				} else if (option === 'month-name') {
					return date.format('MMMM');
				} else if (date[option] != null && typeof date[option] === 'function') {
					return date[option]();
				}

				return date.format(format);
			}
		},
		upper   : function (context, params, data) {
			return function (value) {
				if ($isNull(value)) {
					return null;
				}
				return value.toUpperCase();
			}
		},
		pick    : function (context, params, data) {
			return function () {
				let values = Array.prototype.slice.call(arguments, 0, -1);
				for (let i = 0; i < values.length; i++) {
					let value = values[i];

					if (value != null) {
						return value;
					}
				}
				return null;
			};
		},
		sum     : function (context, params, data) {
			return function () {
				let values = Array.prototype.slice.call(arguments, 0, -1);
				let total = 0;
				for (let i = 0; i < values.length; i++) {
					let value = values[i];
					if (value instanceof Array) {
						total += value.reduce((a, b) => a + b, 0);
					} else {
						total += anxeb.utils.money.normalize(value);
					}
				}
				return total;
			};
		},
		percent : function (context, params, data) {
			return function (dividend, divisor) {
				return anxeb.utils.money.normalize((dividend / divisor) * 100);
			};
		},
		mult    : function (context, params, data) {
			return function (value, mult) {
				return anxeb.utils.money.normalize(value * mult);
			};
		},
		array   : function (context, params, data) {
			return function () {
				return Array.prototype.slice.call(arguments, 0, -1);
			};
		},
		map     : function (context, params, data) {
			return function () {
				let args = Array.prototype.slice.call(arguments);
				let list = args[0];

				let result = [];
				for (let i = 0; i < list.length; i++) {
					let obj = list[i];
					for (let a = 1; a < args.length - 1; a++) {
						obj = obj[args[a]];
					}
					result.push(obj);
				}

				return result;
			}
		},
		caption : function (context, params, data) {
			return function (key, values, defaultValue) {
				let keys = {};
				for (let i = 0; i < values.length; i++) {
					let parts = values[i].split(':');
					keys[parts[0]] = parts[1];
				}
				return keys[key] || defaultValue;
			};
		},
		file    : function (context, params, data) {
			return function (path, id, name) {
				let filePath = anxeb.utils.path.join(path, id, name != null && typeof name === 'string' ? name : 'logo.image');
				if (context.service.storage.exists(filePath)) {
					return context.service.storage.read(filePath);
				} else {
					return ''
				}
			};
		},
		static  : function (context, params, data) {
			return function (path) {
				return context.service.socket.uri + path;
			};
		}
	};

	_self.build = async function (params) {
		let compilerParams;
		if (params.template == null || typeof params.template != 'string') {
			throw new Error('Invalid template provided');
		}

		if (params.template.endsWith('hbs')) {
			compilerParams = {
				hbs : anxeb.utils.path.join(_templatesPath, params.template)
			}
		} else {
			const res = await _context.socket.do.get({
				uri     : context.service.socket.uri + anxeb.utils.url.normalize(params.template),
				json    : true,
				headers : {
					'Content-Type' : 'text/html',
					Authorization  : 'Bearer ' + (params.token || _context.bearer.token)
				}
			});
			compilerParams = {
				content : res.layout,
				root    : _templatesPath
			}
		}

		let data;
		if (params.content.endsWith('}')) {
			data = JSON.parse(params.content);
		} else {
			let apiUri = context.service.socket.uri + anxeb.utils.url.normalize(params.content);
			data = await _context.socket.do.get({
				uri     : apiUri,
				json    : true,
				headers : {
					Authorization : 'Bearer ' + (params.token || _context.bearer.token)
				}
			});
		}

		let name = data[params.key_field || 'id'];
		let fileGroup = params.group || 'misc';

		let reportFilePath = _context.service.locate.storage(_storagePath || 'reports', fileGroup, name + '.pdf');
		let helpers = {};

		if (params.helpers == null) {
			params.helpers = [];
			for (let key in _helpers) {
				params.helpers.push(key);
			}
		}

		for (let i = 0; i < params.helpers.length; i++) {
			let key = params.helpers[i];
			let func = _helpers[key];
			if (func) {
				helpers[key] = func(_context, params, data)
			}
		}

		const html = await _context.service.renderer.compile(compilerParams, { data : data }, {
			helpers : helpers
		});

		const browser = await puppeteer.launch({
			args : ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		let page = await browser.newPage();

		if (_scripts != null) {
			for (let i = 0; i < _scripts.length; i++) {
				await page.addScriptTag({ url : _scripts[i] });
			}
		}

		await page.setContent(html);
		await page.pdf({ path : reportFilePath, format : params.format || 'Letter', printBackground : true });
		await browser.close();

		return {
			name  : name,
			group : fileGroup,
			size  : anxeb.utils.file.stats(reportFilePath).size
		}
	}

	_self.send = async function (params) {
		if (params.rebuild) {
			let result = await _self.build(params);
			params.name = result.name;
		}

		let fileName = params.name + '.pdf';
		let reportFilePath = _context.service.locate.storage(_storagePath || 'reports', params.group || 'misc', fileName);
		let attachmentName = encodeURIComponent(params.attachment ? (params.attachment + '.pdf') : fileName);

		if (!anxeb.utils.file.exists(reportFilePath)) {
			await _self.build(params);
		}

		_context.file(reportFilePath, {
			headers : params.download ? {
				'Content-Disposition' : 'attachment;filename=' + attachmentName + '; filename*=UTF-8\'\'' + attachmentName
			} : {}
		});
	}
};