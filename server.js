const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'https://v0-public-server-dashboard.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Monitoring API is running');
});

// Import Routes
const authRoutes = require('./routes/auth');
const metricsRoutes = require('./routes/metrics');
const agentRoutes = require('./routes/agents');

app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agents', agentRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
