const mongoose = require('mongoose');

const centerSchema = new mongoose.Schema({
  centerId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PHC', 'UPGRADED_PHC', 'SUB_CENTRE'],
    required: true
  },
  division: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  contact: {
    phone: String,
    email: String
  },
  inCharge: {
    staffId: String,
    name: String,
    phone: String,
    email: String
  },
  operatingHours: {
    start: String, // "09:00"
    end: String    // "17:00"
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
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

// Update the updatedAt field before saving
centerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Center', centerSchema);
