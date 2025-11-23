const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const auth = require('../middleware/auth');

// @route   GET api/metrics
// @desc    Get server metrics
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const [cpu, mem, fsSize, networkStats, load] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.networkStats(),
            si.currentLoad() // load average is part of currentLoad or separate depending on OS, but si.currentLoad() gives current load. si.load() gives averages.
        ]);

        const loadAvg = await si.currentLoad(); // Re-fetching to be sure or just use si.currentLoad which returns currentload, currentload_user, currentload_system etc. 
        // Wait, si.currentLoad() gives cpu usage %. 
        // si.load() gives load averages.
        const loadAverages = await si.currentLoad(); // Actually si.currentLoad() returns object with currentLoad, etc.
        // Let's check docs or assume standard. 
        // si.currentLoad() -> { currentLoad: 12.3, ... }
        // si.fsSize() -> array of disks
        // si.networkStats() -> array of interfaces

        // For load averages (1m, 5m, 15m), usually si.currentLoad() doesn't give that. 
        // si.currentLoad() gives CPU usage.
        // si.fullLoad() ? No.
        // Actually si.currentLoad() gives current CPU load in %.
        // For load averages (Unix style), we might need os.loadavg() from node 'os' module or si.currentLoad() might not be enough.
        // Let's use 'os' module for load averages as it's standard node.

        const os = require('os');
        const loadAvgs = os.loadavg(); // Returns [1m, 5m, 15m]

        // Calculate disk usage (sum of all mounted drives or just main?)
        // Let's sum up used and size.
        let totalDiskSize = 0;
        let totalDiskUsed = 0;
        fsSize.forEach(drive => {
            totalDiskSize += drive.size;
            totalDiskUsed += drive.used;
        });
        const diskUsagePercent = (totalDiskUsed / totalDiskSize) * 100;
        const diskFreeBytes = totalDiskSize - totalDiskUsed;

        // Network stats (sum of all interfaces)
        let netIn = 0;
        let netOut = 0;
        networkStats.forEach(iface => {
            netIn += iface.rx_sec; // bytes per second received
            netOut += iface.tx_sec; // bytes per second transferred
        });

        const metrics = {
            cpu_usage: cpu.currentLoad,
            ram_usage: (mem.active / mem.total) * 100,
            disk_usage: diskUsagePercent,
            disk_free: diskFreeBytes, // In bytes, requirement says float but usually bytes are int. JS numbers are floats.
            network_in: netIn,
            network_out: netOut,
            uptime: os.uptime(),
            status: 'online',
            timestamp: Date.now(),
            load_average_1m: loadAvgs[0],
            load_average_5m: loadAvgs[1],
            load_average_15m: loadAvgs[2]
        };

        res.json(metrics);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
