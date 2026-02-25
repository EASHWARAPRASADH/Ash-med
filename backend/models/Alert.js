const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: [
      'LATE_CHECKIN',
      'EARLY_CHECKOUT',
      'ABSENTEEISM',
      'MULTIPLE_ABSENCES',
      'BIOMETRIC_FAILURE',
      'LOCATION_MISMATCH',
      'DEVICE_TAMPER',
      'SYSTEM_ERROR'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    // Additional data specific to alert type
    expectedTime: Date,
    actualTime: Date,
    lateMinutes: Number,
    location: {
      expected: { lat: Number, lng: Number },
      actual: { lat: Number, lng: Number }
    },
    deviceInfo: mongoose.Schema.Types.Mixed
  },
  recipients: [{
    userId: String,
    name: String,
    role: String,
    email: String,
    phone: String,
    notified: {
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      dashboard: { type: Boolean, default: false }
    }
  }],
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'PENDING'
  },
  sentAt: Date,
  acknowledgedAt: Date,
  resolvedAt: Date,
  acknowledgedBy: {
    userId: String,
    name: String,
    role: String
  },
  resolvedBy: {
    userId: String,
    name: String,
    role: String
  },
  resolutionNotes: String,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
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

// Indexes for efficient querying
alertSchema.index({ centerId: 1, createdAt: -1 });
alertSchema.index({ staffId: 1, createdAt: -1 });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ severity: 1, status: 1 });

// Update the updatedAt field before saving
alertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get alerts by center and date range
alertSchema.statics.getByCenterAndDate = function(centerId, startDate, endDate, status = null) {
  const query = {
    centerId: centerId,
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get alert statistics
alertSchema.statics.getStats = async function(centerId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        centerId: centerId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          severity: '$severity'
        },
        count: { $sum: 1 }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Alert', alertSchema);
