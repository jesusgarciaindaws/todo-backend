"use strict";

const Task = require("../schemas/primary/task");

module.exports = {
  collection: "Tasks",
  schema: new Task.Schema(),
  methods: {
    toClient: function () {
      return {
        id: this._id,
        name: this.name,
        description: this.description,
      };
    },
  },
};
