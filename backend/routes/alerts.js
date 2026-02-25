const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { centerId, staffId, type, severity, status, limit = 50 } = req.query;
    const query = {};
    
    if (centerId) query.centerId = centerId;
    if (staffId) query.staffId = staffId;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('staffId', 'name role')
      .populate('centerId', 'name type division');
    
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Server error fetching alerts' });
  }
});

// GET /api/alerts/:alertId
router.get('/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await Alert.findById(alertId)
      .populate('staffId', 'name role phone email')
      .populate('centerId', 'name type division address');
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.status(200).json(alert);
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ error: 'Server error fetching alert' });
  }
});

// PUT /api/alerts/:alertId/acknowledge
router.put('/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId, userName, userRole } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: { userId, name: userName, role: userRole }
      },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.status(200).json({
      message: 'Alert acknowledged successfully',
      alert
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Server error acknowledging alert' });
  }
});

// PUT /api/alerts/:alertId/resolve
router.put('/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId, userName, userRole, resolutionNotes } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: { userId, name: userName, role: userRole },
        resolutionNotes
      },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.status(200).json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Server error resolving alert' });
  }
});

// GET /api/alerts/stats/:centerId
router.get('/stats/:centerId', async (req, res) => {
  try {
    const { centerId } = req.params;
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const stats = await Alert.getStats(centerId, start, end);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ error: 'Server error fetching alert statistics' });
  }
});

module.exports = router;
