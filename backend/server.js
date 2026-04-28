const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
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

// Static files
app.use(express.static(path.join(__dirname, '../scope-agent-hub/dist')));

// Base route
app.get('/api', (req, res) => {
    res.send('Scope Media Solution API is running...');
});

// Handle SPA routing - serve index.html for all non-matched routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../scope-agent-hub/dist/index.html'), (err) => {
        if (err) {
            res.status(404).send('Frontend not built or index.html missing. Please check build logs.');
        }
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
