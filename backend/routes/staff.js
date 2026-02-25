const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// GET /api/staff
router.get('/', async (req, res) => {
  try {
    const { centerId, division, role, status } = req.query;
    const query = {};
    
    if (centerId) query.centerId = centerId;
    if (division) query.division = division;
    if (role) query.role = role;
    if (status) query.status = status;
    
    const staff = await Staff.find(query).select('-biometricData');
    res.status(200).json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Server error fetching staff' });
  }
});

// GET /api/staff/:staffId
router.get('/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const staff = await Staff.findOne({ staffId }).select('-biometricData');
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.status(200).json(staff);
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({ error: 'Server error fetching staff member' });
  }
});

// POST /api/staff
router.post('/', async (req, res) => {
  try {
    const staffData = req.body;
    const staff = new Staff(staffData);
    await staff.save();
    
    res.status(201).json({
      message: 'Staff created successfully',
      staffId: staff.staffId,
      id: staff._id
    });
  } catch (error) {
    console.error('Create staff error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Staff ID or email already exists' });
    }
    res.status(500).json({ error: 'Server error creating staff' });
  }
});

// PUT /api/staff/:staffId
router.put('/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const updateData = req.body;
    
    // Don't allow biometric data updates through this endpoint
    delete updateData.biometricData;
    
    const staff = await Staff.findOneAndUpdate(
      { staffId },
      updateData,
      { new: true, runValidators: true }
    ).select('-biometricData');
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.status(200).json({
      message: 'Staff updated successfully',
      staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Server error updating staff' });
  }
});

module.exports = router;
