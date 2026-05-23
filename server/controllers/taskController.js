const Task = require("../models/Task");
const Activity = require("../models/Activity");

// @desc Get all tasks
// @route GET /api/tasks
// @access Private
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc Create task
// @route POST /api/tasks
// @access Private
const createTask = async (req, res) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      category: req.body.category,
      dueDate: req.body.dueDate,
      status: req.body.status || "To Do",
      user: req.user._id,
    });

    // Activity Log
    await Activity.create({
      action: "Created task",
      taskTitle: task.title,
      user: req.user._id,
    });

    // Socket Event
    const io = req.app.get("io");

    if (io) {
      io.emit("tasksUpdated");
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc Update task
// @route PUT /api/tasks/:id
// @access Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.status = req.body.status || task.status;
    task.category = req.body.category || task.category;
    task.dueDate = req.body.dueDate || task.dueDate;

    const updatedTask = await task.save();

    // Activity Log
    await Activity.create({
      action: "Updated task",
      taskTitle: updatedTask.title,
      user: req.user._id,
    });

    // Socket Event
    const io = req.app.get("io");

    if (io) {
      io.emit("tasksUpdated");
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc Delete task
// @route DELETE /api/tasks/:id
// @access Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    // Activity Log BEFORE delete
    await Activity.create({
      action: "Deleted task",
      taskTitle: task.title,
      user: req.user._id,
    });

    await task.deleteOne();

    // Socket Event
    const io = req.app.get("io");

    if (io) {
      io.emit("tasksUpdated");
    }

    res.json({
      message: "Task removed",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};