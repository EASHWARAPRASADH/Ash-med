const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const Center = require('../models/Center');
const alertService = require('../services/alertService');
const { verifyBiometric } = require('../utils/biometricUtils');

// POST /api/attendance/checkin
router.post('/checkin', async (req, res) => {
  try {
    const { staffId, centerId, biometricHash, biometricType, location, deviceInfo } = req.body;

    // 1. Verify staff exists and is assigned to this center
    const staff = await Staff.findOne({ staffId, centerId, status: 'ACTIVE' });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found or not active at this center' });
    }

    // 2. Verify center exists and is active
    const center = await Center.findOne({ centerId, status: 'ACTIVE' });
    if (!center) {
      return res.status(404).json({ error: 'Center not found or inactive' });
    }

    // 3. Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await Attendance.findOne({
      staffId,
      date: { $gte: today }
    });
    
    if (existingAttendance && existingAttendance.checkIn.time) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    // 4. Verify biometric data
    const isValidBiometric = await verifyBiometric(staff, biometricType, biometricHash);
    if (!isValidBiometric) {
      // Create alert for biometric failure
      await alertService.createBiometricFailureAlert(staffId, centerId, biometricType);
      return res.status(401).json({ error: 'Biometric verification failed' });
    }

    // 5. Determine expected check-in time and calculate lateness
    const now = new Date();
    const expectedTime = new Date(now);
    const [hours, minutes] = center.operatingHours.start.split(':');
    expectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const isLate = now > expectedTime;
    const lateMinutes = isLate ? Math.floor((now - expectedTime) / (1000 * 60)) : 0;

    // 6. Create or update attendance record
    let attendance;
    if (existingAttendance) {
      // Update existing record (might be created for leave tracking)
      attendance = existingAttendance;
      attendance.checkIn = {
        time: now,
        location,
        biometricType,
        biometricHash,
        deviceInfo,
        verified: true
      };
      attendance.status = isLate ? 'LATE' : 'PRESENT';
      attendance.isLate = isLate;
      attendance.lateMinutes = lateMinutes;
    } else {
      // Create new attendance record
      attendance = new Attendance({
        staffId,
        centerId,
        date: today,
        checkIn: {
          time: now,
          location,
          biometricType,
          biometricHash,
          deviceInfo,
          verified: true
        },
        status: isLate ? 'LATE' : 'PRESENT',
        isLate,
        lateMinutes
      });
    }

    await attendance.save();

    // 7. Trigger alerts if late
    if (isLate) {
      await alertService.sendLateAlert(staff, center, now, lateMinutes);
    }

    // 8. Send real-time update to dashboard
    const io = req.app.get('io');
    io.emit('attendanceUpdate', {
      type: 'CHECKIN',
      staffId,
      centerId,
      timestamp: now,
      status: attendance.status
    });

    res.status(201).json({
      message: 'Check-in successful',
      isLate,
      lateMinutes,
      checkInTime: now,
      status: attendance.status
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error during check-in' });
  }
});

// POST /api/attendance/checkout
router.post('/checkout', async (req, res) => {
  try {
    const { staffId, centerId, biometricHash, biometricType, location, deviceInfo } = req.body;

    // 1. Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      staffId,
      centerId,
      date: { $gte: today }
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    // 2. Verify staff
    const staff = await Staff.findOne({ staffId, centerId, status: 'ACTIVE' });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found or not active at this center' });
    }

    // 3. Verify biometric data
    const isValidBiometric = await verifyBiometric(staff, biometricType, biometricHash);
    if (!isValidBiometric) {
      return res.status(401).json({ error: 'Biometric verification failed' });
    }

    // 4. Determine expected check-out time and calculate early departure
    const now = new Date();
    const center = await Center.findOne({ centerId });
    const expectedTime = new Date(now);
    const [hours, minutes] = center.operatingHours.end.split(':');
    expectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const isEarlyDeparture = now < expectedTime;
    const earlyDepartureMinutes = isEarlyDeparture ? Math.floor((expectedTime - now) / (1000 * 60)) : 0;

    // 5. Update attendance record
    attendance.checkOut = {
      time: now,
      location,
      biometricType,
      biometricHash,
      deviceInfo,
      verified: true
    };
    
    if (isEarlyDeparture) {
      attendance.isEarlyDeparture = true;
      attendance.earlyDepartureMinutes = earlyDepartureMinutes;
      attendance.status = 'EARLY_DEPARTURE';
      
      // Trigger alert for early departure
      await alertService.sendEarlyDepartureAlert(staff, center, now, earlyDepartureMinutes);
    }

    await attendance.save();

    // 6. Send real-time update to dashboard
    const io = req.app.get('io');
    io.emit('attendanceUpdate', {
      type: 'CHECKOUT',
      staffId,
      centerId,
      timestamp: now,
      status: attendance.status,
      totalWorkHours: attendance.totalWorkHours
    });

    res.status(200).json({
      message: 'Check-out successful',
      isEarlyDeparture,
      earlyDepartureMinutes,
      checkOutTime: now,
      totalWorkHours: attendance.totalWorkHours
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Server error during check-out' });
  }
});

// GET /api/attendance/:centerId/:date
router.get('/:centerId/:date', async (req, res) => {
  try {
    const { centerId, date } = req.params;
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      centerId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('staffId', 'name role designation');

    res.status(200).json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Server error fetching attendance' });
  }
});

// GET /api/attendance/stats/:centerId
router.get('/stats/:centerId', async (req, res) => {
  try {
    const { centerId } = req.params;
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const stats = await Attendance.getStats(centerId, start, end);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Server error fetching attendance statistics' });
  }
});

// GET /api/attendance/staff/:staffId
router.get('/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query = { staffId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('centerId', 'name type division');
    
    res.status(200).json(attendance);
  } catch (error) {
    console.error('Get staff attendance error:', error);
    res.status(500).json({ error: 'Server error fetching staff attendance' });
  }
});

module.exports = router;
