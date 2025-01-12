import Task from '../models/taskModel.js';
import { io } from '../server.js';

export const createTask = async (req, res) => {
    try {
        const task = await Task.create({
            ...req.body,
            user: req.user._id
        });

        // Emit real-time update
        io.emit('taskCreated', task);

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user._id });
        res.json(tasks);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Emit real-time update
        io.emit('taskUpdated', task);

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Emit real-time update
        io.emit('taskDeleted', req.params.id);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getTaskStats = async (req, res) => {
    try {
        const stats = await Task.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    overdueTasks: {
                        $sum: {
                            $cond: [
                                { $lt: ['$dueDate', new Date()] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const formattedStats = {
            pending: 0,
            'in-progress': 0,
            completed: 0,
            overdueTasks: 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
            formattedStats.overdueTasks += stat.overdueTasks;
        });

        res.json(formattedStats);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};