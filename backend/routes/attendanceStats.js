const express = require('express');
const router = express.Router();

// Get attendance statistics
router.get('/stats', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const Staff = require('../models/Staff');
    const Alert = require('../models/Alert');
    const Center = require('../models/Center');

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate statistics
    const [
      totalCenters,
      totalStaff,
      todayAttendance,
      todayAlerts
    ] = await Promise.all([
      Center.countDocuments({ status: 'ACTIVE' }),
      Staff.countDocuments({ status: 'ACTIVE' }),
      Attendance.find({ date: { $gte: today } }),
      Alert.find({ createdAt: { $gte: today } })
    ]);

    const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;
    const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const lateToday = todayAttendance.filter(a => a.status === 'LATE').length;

    const stats = {
      totalCenters,
      activeStaff: totalStaff,
      presentToday,
      absentToday,
      lateToday,
      alertsToday: todayAlerts.length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});

// Get weekly trends
router.get('/trends', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    
    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    // Group by day and calculate trends
    const trends = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    for (let i = 0; i < 5; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (4 - i));
      targetDate.setHours(0, 0, 0, 0);
      
      const dayAttendance = attendance.filter(a => 
        a.date.toDateString() === targetDate.toDateString()
      );
      
      const present = dayAttendance.filter(a => a.status === 'PRESENT').length;
      const absent = dayAttendance.filter(a => a.status === 'ABSENT').length;
      const late = dayAttendance.filter(a => a.status === 'LATE').length;
      
      trends.push({
        date: days[i],
        present,
        absent,
        late
      });
    }

    res.json(trends);
  } catch (error) {
    console.error('Error fetching attendance trends:', error);
    res.status(500).json({ error: 'Failed to fetch attendance trends' });
  }
});

module.exports = router;
