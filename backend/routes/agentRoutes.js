const express = require('express');
const router = express.Router();
const { createAgent, getAgents, getAgentStats } = require('../controllers/agentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/create', protect, admin, createAgent);
router.get('/', protect, admin, getAgents);
router.get('/stats', protect, admin, getAgentStats);

module.exports = router;
