'use strict';

const anxeb = require('anxeb-node');

module.exports = {
	url     : '/users',
	type    : anxeb.Route.types.action,
	access  : anxeb.Route.access.public,
	timeout : 60000,
	methods : {
		/**
		 * @openapi
		 * /users:
		 *   get:
		 *     description: Return a list of all the users
		 *     tags: [Users]
		 *     responses:
		 *       200:
		 *         description: List of users
		 *         content:
		 *           application/json:
		 *            schema:
		 *              $ref: '#/components/schemas/UserList'
		 */
		get : async function (context) {
			const users = await context.data.list.User({});
			context.send(users.toClient());
		},
		/**
		 * @swagger
		 * /users:
		 *   post:
		 *     description: Create a new user
		 *     tags: [Users]
		 *     requestBody:
		 *       required: true
		 *       content:
		 *         application/json:
		 *           schema:
		 *             $ref: '#/components/schemas/UserPayload'
		 *     responses:
		 *       200:
		 *         description: The user was created
		 *         content:
		 *           application/json:
		 *            schema:
		 *              $ref: '#/components/schemas/User'
		 */
		post : async function (context) {
			const payload = context.payload;
			const user = context.data.create.User({
				first_names : payload.first_names,
				role : payload.role,
				info : payload.info,
				mera : payload.meta,	
			});

			await user.persist();

			context.send(user.toClient());
		}
	},
	childs  : {
		item : {
			url     : '/:userId',
			methods : {
				/**
				 * @openapi
				 * /users/{userId}:
				 *   get:
				 *     description: Get a specific user by id
				 *     tags: [Users]
				 *     parameters:
				 *        - name: userId
				 *          type: string
				 *          in: path
				 *          required: true
				 *          description: The user id
				 *     responses:
				 *       200:
				 *         description: The user was retrieved
				 *         content:
				 *           application/json:
				 *            schema:
				 *              $ref: '#/components/schemas/User'
				 *       404:
				 *         description: The user was not found
				 */
				get : async function (context) {
					const user = await context.data.retrieve.User(context.params.userId);

					if (!user) {
						context.log.exception.record_not_found.args('Usuario', context.params.userId).throw();
					}

					context.send(user.toClient());
				},
				/**
				 * @openapi
				 * /users/{userId}:
				 *   put:
				 *     description: Update a specific user
				 *     tags: [Users]
				 *     parameters:
				 *       - name: userId
				 *         type: string
				 *         in: path
				 *         required: true
				 *         description: The user id
				 *     requestBody:
				 *       required: true
				 *       content:
				 *         application/json:
				 *           schema:
				 *             $ref: '#/components/schemas/UserPayload'
				 *     responses:
				 *       200:
				 *         description: The user was updated
				 *         content:
				 *           application/json:
				 *             schema:
				 *               $ref: '#/components/schemas/User'
				 *       404:
				 *         description: The user was not found
				 *       500:
				 *         description: An error happened
				 */
				put : async function (context) {
					const user = await context.data.retrieve.User(context.params.userId);
					const payload = context.payload;

					if (!user) {
						context.log.exception.record_not_found.args('Usuario', context.params.userId).throw();
					}

					user.first_names = payload.first_names;
					user.role = payload.role;
					user.info = payload.info;
					user.mera = payload.meta;	
					await user.persist();

					context.send(user.toClient());
				},
				/**
				 * @openapi
				 * /users/{userId}:
				 *   delete:
				 *     description: Remove a specific user
				 *     tags: [Users]
				 *     parameters:
				 *       - name: userId
				 *         type: string
				 *         in: path
				 *         required: true
				 *         description: The user id
				 *     responses:
				 *       200:
				 *         description: The user was deleted
				 *       404:
				 *         description: The user was not found
				 */
				delete : async function (context) {
					const user = await context.data.retrieve.User(context.params.userId);

					if (!user) {
						context.log.exception.record_not_found.args('Usuario', context.params.userId).throw();
					}

					await user.delete();
					context.ok();
				}
			}
		}
	}
};