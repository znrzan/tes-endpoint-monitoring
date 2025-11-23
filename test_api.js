const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';
let agentId = '';

async function testAuth() {
    console.log('--- Testing Auth ---');
    try {
        // Register
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            username: `testuser${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            password: 'password123'
        });
        console.log('Register Success:', regRes.data);
        token = regRes.data.token;

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: regRes.config.data.match(/"email":"(.*?)"/)[1], // Extract email used
            password: 'password123'
        });
        console.log('Login Success:', loginRes.data);
        token = loginRes.data.token;
    } catch (err) {
        console.error('Auth Error:', err.response ? err.response.data : err.message);
    }
}

async function testMetrics() {
    console.log('\n--- Testing Metrics ---');
    try {
        const res = await axios.get(`${API_URL}/metrics`, {
            headers: { 'x-auth-token': token }
        });
        console.log('Metrics:', Object.keys(res.data));
    } catch (err) {
        console.error('Metrics Error:', err.response ? err.response.data : err.message);
    }
}

async function testAgents() {
    console.log('\n--- Testing Agents ---');
    try {
        // Create
        const createRes = await axios.post(`${API_URL}/agents`, {
            name: 'Test Agent',
            url: 'http://example.com',
            interval: 60
        }, { headers: { 'x-auth-token': token } });
        console.log('Create Agent:', createRes.data);
        agentId = createRes.data.id;

        // List
        const listRes = await axios.get(`${API_URL}/agents`, {
            headers: { 'x-auth-token': token }
        });
        console.log('List Agents:', listRes.data.length);

        // Update
        const updateRes = await axios.put(`${API_URL}/agents/${agentId}`, {
            status: 'inactive'
        }, { headers: { 'x-auth-token': token } });
        console.log('Update Agent:', updateRes.data.status);

        // Delete
        const deleteRes = await axios.delete(`${API_URL}/agents/${agentId}`, {
            headers: { 'x-auth-token': token }
        });
        console.log('Delete Agent:', deleteRes.data);
    } catch (err) {
        console.error('Agent Error:', err.response ? err.response.data : err.message);
    }
}

async function run() {
    await testAuth();
    if (token) {
        await testMetrics();
        await testAgents();
    }
}

run();
