"use strict";

const anxeb = require("anxeb-node");

module.exports = {
  url: "/tasks",
  type: anxeb.Route.types.action,
  access: anxeb.Route.access.public,
  owners: "*",
  roles: {
    get: "*",
    post: ["*"],
    put: ["*"],
    delete: ["*"],
  },
  timeout: 60000,
  methods: {
    /**
     * @openapi
     * /tasks:
     *   get:
     *     description: Return a list of all the tasks
     *     tags: [Tasks]
     *     responses:
     *       200:
     *         description: List of tasks
     *         content:
     *           application/json:
     *            schema:
     *              $ref: '#/components/schemas/TaskList'
     */
    get: async function (context) {
      const tasks = await context.data.list.Task();
      context.send(tasks);
    },
    /**
     * @swagger
     * /tasks:
     *   post:
     *     description: Create a new task
     *     tags: [Tasks]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/TaskPayload'
     *     responses:
     *       200:
     *         description: The task was created
     *         content:
     *           application/json:
     *            schema:
     *              $ref: '#/components/schemas/UsTasker'
     */
    post: async function (context) {
      const payload = context.payload;
      const task = context.data.create.Task({
        name: payload.name,
        description: payload.description,
      });
      console.log(task);
      await task.persist();
      context.send(task);
    },
  },
  childs: {
    item: {
      url: "/:taskId",
      methods: {
        /**
         * @openapi
         * /task/{taskId}:
         *   get:
         *     description: Get a specific user by id
         *     tags: [Tasks]
         *     parameters:
         *        - name: taskId
         *          type: string
         *          in: path
         *          required: true
         *          description: The task id
         *     responses:
         *       200:
         *         description: The task was retrieved
         *         content:
         *           application/json:
         *            schema:
         *              $ref: '#/components/schemas/Task'
         *       404:
         *         description: The task was not found
         */
        get: async function (context) {
          const task = await context.data.retrieve.Task(context.params.taskId);

          if (!task) {
            context.log.exception.record_not_found
              .args("Tarea", context.params.taskId)
              .throw();
          }
          context.send(task.toClient());
        },
        /**
         * @openapi
         * /tasks/{taskId}:
         *   put:
         *     description: Update a specific task
         *     tags: [Tasks]
         *     parameters:
         *       - name: taskId
         *         type: string
         *         in: path
         *         required: true
         *         description: The task id
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/TaskPayload'
         *     responses:
         *       200:
         *         description: The task was updated
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Task'
         *       404:
         *         description: The Tasj was not found
         *       500:
         *         description: An error happened
         */
        put: async function (context) {
          const task = await context.data.retrieve.Task(context.params.taskId);
          const payload = context.payload;
          if (!task) {
            context.log.exception.record_not_found
              .args("Task", context.params.taskId)
              .throw();
          }
          if (context.profile.user.role == "admin") {
            (task.name = payload.name),
              (task.description = payload.description),
              (task.done = payload.done),
              (task.date = anxeb.utils.date.now().unix()),
              await task.persist();
            context.send(task.toClient());
          } else if (task.owner == context.profile.identity) {
            (task.name = payload.name),
              (task.description = payload.description),
              (task.done = payload.done),
              (task.date = anxeb.utils.date.now().unix()),
              await task.persist();
            context.send(task.toClient());
          } else {
            context.send("No puedes editar");
          }
        },
        /**
         * @openapi
         * /tasks/{taskId}:
         *   delete:
         *     description: Remove a specific task
         *     tags: [Tasks]
         *     parameters:
         *       - name: taskId
         *         type: string
         *         in: path
         *         required: true
         *         description: The task id
         *     responses:
         *       200:
         *         description: The task was deleted
         *       404:
         *         description: The task was not found
         */
        delete: async function (context) {
          console.log(context.params.taskId);
          const task = await context.data.retrieve.Task(context.params.taskId);

          if (!task) {
            console.log(context.params);

            context.log.exception.record_not_found
              .args("Task", context.params.taskId)
              .throw();
          }
          await task.delete();
          context.ok();
        },
      },
    },
  },
};
