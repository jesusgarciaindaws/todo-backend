'use strict';

const anxeb = require('anxeb-node');

module.exports = {
	url     : '/',
	access  : anxeb.Route.access.public,
	timeout : 60000,
	methods : {
		/**
		 * @openapi
		 * /:
		 *   get:
		 *     description: Information about the running API service
		 *     tags: [Version]
		 *     responses:
		 *       200:
		 *         description: Returns the HTML page with information about the running API service
		 *         content:
		 *           text/html:
		 *             schema: {}
		 */
		get : function (context) {
			context.send("<span style='font-family: Verdana'><b>" + context.service.name + " " + context.service.version + "</b><br>build " + context.service.server.version + "</span>");
		}
	}
};
