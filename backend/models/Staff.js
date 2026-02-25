const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'ADMIN_STAFF', 'CENTER_INCHARGE', 'DDHS'],
    required: true
  },
  centerId: {
    type: String,
    required: true,
    ref: 'Center'
  },
  division: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  qualifications: [String],
  experience: {
    type: Number, // years
    default: 0
  },
  biometricData: {
    fingerprintHash: String,
    facialRecognitionHash: String,
    irisScanHash: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  workSchedule: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ON_LEAVE', 'TRANSFERRED', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash biometric data before saving
staffSchema.pre('save', async function(next) {
  if (this.isModified('biometricData.fingerprintHash')) {
    this.biometricData.fingerprintHash = await bcrypt.hash(this.biometricData.fingerprintHash, 12);
  }
  if (this.isModified('biometricData.facialRecognitionHash')) {
    this.biometricData.facialRecognitionHash = await bcrypt.hash(this.biometricData.facialRecognitionHash, 12);
  }
  if (this.isModified('biometricData.irisScanHash')) {
    this.biometricData.irisScanHash = await bcrypt.hash(this.biometricData.irisScanHash, 12);
  }
  this.updatedAt = Date.now();
  next();
});

// Method to verify biometric data
staffSchema.methods.verifyBiometric = async function(type, hash) {
  switch (type) {
    case 'fingerprint':
      return await bcrypt.compare(hash, this.biometricData.fingerprintHash);
    case 'facial':
      return await bcrypt.compare(hash, this.biometricData.facialRecognitionHash);
    case 'iris':
      return await bcrypt.compare(hash, this.biometricData.irisScanHash);
    default:
      return false;
  }
};

module.exports = mongoose.model('Staff', staffSchema);
