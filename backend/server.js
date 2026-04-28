const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const leadRoutes = require('./routes/leadRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/lead', leadRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('Scope Media Solution API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
