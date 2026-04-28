const User = require('../models/User');
const Lead = require('../models/Lead');

// @desc    Create new agent
// @route   POST /api/agent/create
// @access  Private/Admin
const createAgent = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const agent = await User.create({
            name,
            email,
            password,
            role: 'agent'
        });

        if (agent) {
            res.status(201).json({
                _id: agent._id,
                name: agent.name,
                email: agent.email,
                role: agent.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all agents
// @route   GET /api/agent
// @access  Private/Admin
const getAgents = async (req, res) => {
    try {
        const agents = await User.find({ role: 'agent' }).select('-password');
        res.json(agents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get agent stats
// @route   GET /api/agent/stats
// @access  Private/Admin
const getAgentStats = async (req, res) => {
    try {
        const agents = await User.find({ role: 'agent' });
        
        const stats = await Promise.all(agents.map(async (agent) => {
            const totalLeads = await Lead.countDocuments({ agent_id: agent._id });
            const totalTricked = await Lead.countDocuments({ agent_id: agent._id, status: 'tricked' });
            
            return {
                agentId: agent._id,
                name: agent.name,
                email: agent.email,
                totalLeads,
                totalTricked
            };
        }));

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createAgent, getAgents, getAgentStats };
