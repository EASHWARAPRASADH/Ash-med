const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  centerId: {
    type: String,
    required: true,
    ref: 'Center'
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      lat: Number,
      lng: Number,
      accuracy: Number
    },
    biometricType: {
      type: String,
      enum: ['FINGERPRINT', 'FACIAL', 'IRIS', 'MANUAL'],
      required: true
    },
    biometricHash: String,
    deviceInfo: {
      deviceId: String,
      deviceType: String,
      appVersion: String
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  checkOut: {
    time: Date,
    location: {
      lat: Number,
      lng: Number,
      accuracy: Number
    },
    biometricType: {
      type: String,
      enum: ['FINGERPRINT', 'FACIAL', 'IRIS', 'MANUAL']
    },
    biometricHash: String,
    deviceInfo: {
      deviceId: String,
      deviceType: String,
      appVersion: String
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  breakTimes: [{
    start: Date,
    end: Date,
    reason: String
  }],
  totalWorkHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'EARLY_DEPARTURE', 'ON_LEAVE'],
    default: 'PRESENT'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  isEarlyDeparture: {
    type: Boolean,
    default: false
  },
  earlyDepartureMinutes: {
    type: Number,
    default: 0
  },
  notes: String,
  verifiedBy: {
    staffId: String,
    name: String,
    role: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate check-ins for same staff on same date
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

// Update the updatedAt field before saving
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total work hours if checkOut is present
  if (this.checkIn.time && this.checkOut.time) {
    const totalMs = this.checkOut.time - this.checkIn.time;
    let breakMs = 0;
    
    // Subtract break times
    this.breakTimes.forEach(breakTime => {
      if (breakTime.start && breakTime.end) {
        breakMs += breakTime.end - breakTime.start;
      }
    });
    
    this.totalWorkHours = (totalMs - breakMs) / (1000 * 60 * 60); // Convert to hours
  }
  
  next();
});

// Static method to get attendance statistics
attendanceSchema.statics.getStats = async function(centerId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        centerId: centerId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
