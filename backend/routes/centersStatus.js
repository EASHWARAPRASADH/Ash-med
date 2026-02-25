const express = require('express');
const router = express.Router();

// Get centers with current status
router.get('/status', async (req, res) => {
  try {
    const Center = require('../models/Center');
    const Attendance = require('../models/Attendance');
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active centers
    const centers = await Center.find({ status: 'ACTIVE' });
    
    // Get today's attendance for each center
    const todayAttendance = await Attendance.find({ 
      date: { $gte: today } 
    });

    // Calculate status for each center
    const centersWithStatus = centers.map(center => {
      const centerAttendance = todayAttendance.filter(a => 
        a.centerId === center.centerId
      );
      
      const presentStaff = centerAttendance.filter(a => 
        a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      
      const totalStaff = centerAttendance.length || 1; // Avoid division by zero
      
      let status = 'GREEN';
      if (presentStaff === 0) {
        status = 'RED';
      } else if (presentStaff < totalStaff) {
        status = 'YELLOW';
      }
      
      return {
        centerId: center.centerId,
        name: center.name,
        type: center.type,
        division: center.division,
        totalStaff: totalStaff,
        presentStaff: presentStaff,
        absentStaff: totalStaff - presentStaff,
        status: status,
        lastUpdate: new Date().toISOString()
      };
    });

    res.json(centersWithStatus);
  } catch (error) {
    console.error('Error fetching centers status:', error);
    res.status(500).json({ error: 'Failed to fetch centers status' });
  }
});

module.exports = router;
