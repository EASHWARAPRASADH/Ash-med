const express = require('express');
const router = express.Router();
const Center = require('../models/Center');
const Attendance = require('../models/Attendance');

// GET /api/centers
router.get('/', async (req, res) => {
  try {
    const { division, district, type, status } = req.query;
    const query = {};
    
    if (division) query.division = division;
    if (district) query.district = district;
    if (type) query.type = type;
    if (status) query.status = status;
    
    const centers = await Center.find(query);
    res.status(200).json(centers);
  } catch (error) {
    console.error('Get centers error:', error);
    res.status(500).json({ error: 'Server error fetching centers' });
  }
});

// GET /api/centers/:centerId
router.get('/:centerId', async (req, res) => {
  try {
    const { centerId } = req.params;
    const center = await Center.findOne({ centerId });
    
    if (!center) {
      return res.status(404).json({ error: 'Center not found' });
    }
    
    res.status(200).json(center);
  } catch (error) {
    console.error('Get center error:', error);
    res.status(500).json({ error: 'Server error fetching center' });
  }
});

// GET /api/centers/status/all
router.get('/status/all', async (req, res) => {
  try {
    const { division } = req.query;
    const query = division ? { division } : {};
    
    const centers = await Center.find(query);
    
    // Get current attendance status for each center
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const centersWithStatus = await Promise.all(
      centers.map(async (center) => {
        const attendance = await Attendance.find({
          centerId: center.centerId,
          date: { $gte: today }
        });
        
        const totalStaff = attendance.length;
        const presentStaff = attendance.filter(a => 
          a.status === 'PRESENT' || a.status === 'LATE'
        ).length;
        const absentStaff = totalStaff - presentStaff;
        
        let status = 'GREEN'; // All present
        if (absentStaff > 0 && absentStaff < totalStaff) {
          status = 'YELLOW'; // Partial absenteeism
        } else if (absentStaff === totalStaff && totalStaff > 0) {
          status = 'RED'; // Complete absenteeism
        }
        
        return {
          ...center.toObject(),
          attendanceStatus: {
            totalStaff,
            presentStaff,
            absentStaff,
            status,
            lastUpdate: attendance.length > 0 ? 
              Math.max(...attendance.map(a => new Date(a.updatedAt))) : null
          }
        };
      })
    );
    
    res.status(200).json(centersWithStatus);
  } catch (error) {
    console.error('Get centers status error:', error);
    res.status(500).json({ error: 'Server error fetching centers status' });
  }
});

// POST /api/centers
router.post('/', async (req, res) => {
  try {
    const centerData = req.body;
    const center = new Center(centerData);
    await center.save();
    
    res.status(201).json({
      message: 'Center created successfully',
      centerId: center.centerId,
      id: center._id
    });
  } catch (error) {
    console.error('Create center error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Center ID already exists' });
    }
    res.status(500).json({ error: 'Server error creating center' });
  }
});

// PUT /api/centers/:centerId
router.put('/:centerId', async (req, res) => {
  try {
    const { centerId } = req.params;
    const updateData = req.body;
    
    const center = await Center.findOneAndUpdate(
      { centerId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!center) {
      return res.status(404).json({ error: 'Center not found' });
    }
    
    res.status(200).json({
      message: 'Center updated successfully',
      center
    });
  } catch (error) {
    console.error('Update center error:', error);
    res.status(500).json({ error: 'Server error updating center' });
  }
});

module.exports = router;
