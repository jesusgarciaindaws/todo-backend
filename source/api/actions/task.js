'use strict';

const anxeb = require('anxeb-node');

module.exports = {
    url: '/tasks',
    type: anxeb.Route.types.action,
    access: anxeb.Route.access.public,
    timeout: 60000,
    methods: {

        get: async function (context) {
            const tasks = await context.data.list.Task({});
            context.send(tasks.toClient());
        },

        post: async function (context) {
            const payload = context.payload;
            const task = context.data.create.Task({
                task: payload.task,
                desc: payload.desc,
                date: payload.date,
                completed: false,
            });

            await task.persist();

            context.send(task.toClient());
        }
    },
    childs: {
        item: {
            url: '/:taskId',
            methods: {

                get: async function (context) {
                    const task = await context.data.retrieve.Task(context.params.taskId);

                    if (!task) {
                        context.log.exception.record_not_found.args('Tarea', context.params.taskId).throw();
                    }

                    context.send(task.toClient());
                },

                put: async function (context) {
                    const task = await context.data.retrieve.Task(context.params.taskId);
                    const payload = context.payload;

                    if (!task) {
                        context.log.exception.record_not_found.args('Task', context.params.taskId).throw();
                    }

                    task.task_names = payload.task_names;
                    await task.persist();

                    context.send(task.toClient());
                },

                delete: async function (context) {
                    const task = await context.data.retrieve.Task(context.params.taskId);

                    if (!task) {
                        context.log.exception.record_not_found.args('Task', context.params.taskId).throw();
                    }

                    await task.delete();
                    context.ok();
                }
            }
        }
    }
};