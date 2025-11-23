const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// @route   POST api/agents
// @desc    Create a new agent
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, url, interval } = req.body;

    try {
        const { data: agent, error } = await supabase
            .from('agents')
            .insert([
                {
                    name,
                    url,
                    interval,
                    user_id: req.user.id
                }
            ])
            .select()
            .single();

        if (error) throw error;
        res.json(agent);
    } catch (err) {
        console.error(err.message);
        if (err.code === '22P02') {
            return res.status(404).json({ msg: 'Agent not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET api/agents
// @desc    Get all agents for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { data: agents, error } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(agents);
    } catch (err) {
        console.error(err.message);
        if (err.code === '22P02') {
            return res.status(404).json({ msg: 'Agent not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET api/agents/:id
// @desc    Get agent by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const { data: agent, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!agent) {
            return res.status(404).json({ msg: 'Agent not found' });
        }

        // Make sure user owns agent
        if (agent.user_id !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(agent);
    } catch (err) {
        console.error(err.message);
        // Supabase error for invalid UUID might look different, but generally:
        if (err.code === '22P02') { // Postgres invalid text representation (UUID)
            return res.status(404).json({ msg: 'Agent not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/agents/:id
// @desc    Update agent
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { name, url, interval, status } = req.body;

    // Build agent object
    const agentFields = {};
    if (name) agentFields.name = name;
    if (url) agentFields.url = url;
    if (interval) agentFields.interval = interval;
    if (status) agentFields.status = status;

    try {
        // Check ownership first
        const { data: existingAgent, error: fetchError } = await supabase
            .from('agents')
            .select('user_id')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !existingAgent) {
            return res.status(404).json({ msg: 'Agent not found' });
        }

        if (existingAgent.user_id !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { data: agent, error } = await supabase
            .from('agents')
            .update(agentFields)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(agent);
    } catch (err) {
        console.error(err.message);
        if (err.code === '22P02') {
            return res.status(404).json({ msg: 'Agent not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/agents/:id
// @desc    Delete agent
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check ownership first
        const { data: existingAgent, error: fetchError } = await supabase
            .from('agents')
            .select('user_id')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !existingAgent) {
            return res.status(404).json({ msg: 'Agent not found' });
        }

        if (existingAgent.user_id !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ msg: 'Agent removed' });
    } catch (err) {
        console.error(err.message);
        if (err.code === '22P02') {
            return res.status(404).json({ msg: 'Agent not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
