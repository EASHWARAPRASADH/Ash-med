// Sample data seeding script for MongoDB
// Run this script to populate your database with sample data

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Center = require('./models/Center');
const Staff = require('./models/Staff');
const Attendance = require('./models/Attendance');
const Alert = require('./models/Alert');

const sampleData = {
  centers: [
    {
      centerId: 'PHC001',
      name: 'Primary Health Center - Urban',
      type: 'PHC',
      division: 'Central Division',
      district: 'Central District',
      state: 'Delhi',
      location: {
        lat: 28.6139,
        lng: 77.2090
      },
      address: '123 Main Street, Central Delhi',
      contact: {
        phone: '+91-11-23456789',
        email: 'phc001@ephc.gov'
      },
      inCharge: {
        staffId: 'DOC001',
        name: 'Dr. Ramesh Kumar',
        phone: '+91-9876543210',
        email: 'ramesh.kumar@ephc.gov'
      },
      operatingHours: {
        start: '09:00',
        end: '17:00'
      },
      status: 'ACTIVE'
    },
    {
      centerId: 'PHC002',
      name: 'Primary Health Center - Rural',
      type: 'PHC',
      division: 'North Division',
      district: 'North District',
      state: 'Delhi',
      location: {
        lat: 28.7041,
        lng: 77.1025
      },
      address: '45 Village Road, North Delhi',
      contact: {
        phone: '+91-11-23456790',
        email: 'phc002@ephc.gov'
      },
      inCharge: {
        staffId: 'DOC002',
        name: 'Dr. Priya Sharma',
        phone: '+91-9876543211',
        email: 'priya.sharma@ephc.gov'
      },
      operatingHours: {
        start: '08:00',
        end: '16:00'
      },
      status: 'ACTIVE'
    },
    {
      centerId: 'SC001',
      name: 'Sub-Centre - Village A',
      type: 'SUB_CENTRE',
      division: 'South Division',
      district: 'South District',
      state: 'Delhi',
      location: {
        lat: 28.5355,
        lng: 77.3910
      },
      address: '12 Gram Panchayat Road, Village A',
      contact: {
        phone: '+91-11-23456791',
        email: 'sc001@ephc.gov'
      },
      inCharge: {
        staffId: 'NUR001',
        name: 'Smt. Anita Devi',
        phone: '+91-9876543212',
        email: 'anita.devi@ephc.gov'
      },
      operatingHours: {
        start: '09:00',
        end: '13:00'
      },
      status: 'ACTIVE'
    }
  ],

  staff: [
    {
      staffId: 'DOC001',
      name: 'Dr. Ramesh Kumar',
      email: 'ramesh.kumar@ephc.gov',
      phone: '+91-9876543210',
      role: 'DOCTOR',
      centerId: 'PHC001',
      division: 'Central Division',
      designation: 'Senior Medical Officer',
      qualifications: ['MBBS', 'MD'],
      experience: 15,
      emergencyContact: {
        name: 'Smt. Sunita Kumar',
        phone: '+91-9876543211',
        relation: 'Spouse'
      },
      workSchedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '14:00' },
        sunday: { start: '10:00', end: '14:00' }
      },
      status: 'ACTIVE'
    },
    {
      staffId: 'DOC002',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@ephc.gov',
      phone: '+91-9876543211',
      role: 'DOCTOR',
      centerId: 'PHC002',
      division: 'North Division',
      designation: 'Medical Officer',
      qualifications: ['MBBS', 'DCH'],
      experience: 8,
      emergencyContact: {
        name: 'Mr. Rajesh Sharma',
        phone: '+91-9876543213',
        relation: 'Spouse'
      },
      workSchedule: {
        monday: { start: '08:00', end: '16:00' },
        tuesday: { start: '08:00', end: '16:00' },
        wednesday: { start: '08:00', end: '16:00' },
        thursday: { start: '08:00', end: '16:00' },
        friday: { start: '08:00', end: '16:00' },
        saturday: { start: '08:00', end: '14:00' },
        sunday: { start: '10:00', end: '14:00' }
      },
      status: 'ACTIVE'
    },
    {
      staffId: 'NUR001',
      name: 'Smt. Anita Devi',
      email: 'anita.devi@ephc.gov',
      phone: '+91-9876543212',
      role: 'NURSE',
      centerId: 'SC001',
      division: 'South Division',
      designation: 'ANM/Health Worker',
      qualifications: ['ANM', 'GNM'],
      experience: 12,
      emergencyContact: {
        name: 'Mr. Mohan Devi',
        phone: '+91-9876543214',
        relation: 'Spouse'
      },
      workSchedule: {
        monday: { start: '09:00', end: '13:00' },
        tuesday: { start: '09:00', end: '13:00' },
        wednesday: { start: '09:00', end: '13:00' },
        thursday: { start: '09:00', end: '13:00' },
        friday: { start: '09:00', end: '13:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: { start: '10:00', end: '13:00' }
      },
      status: 'ACTIVE'
    },
    {
      staffId: 'PHARM001',
      name: 'Mr. Rajesh Gupta',
      email: 'rajesh.gupta@ephc.gov',
      phone: '+91-9876543215',
      role: 'PHARMACIST',
      centerId: 'PHC001',
      division: 'Central Division',
      designation: 'Senior Pharmacist',
      qualifications: ['B.Pharm', 'D.Pharm'],
      experience: 10,
      emergencyContact: {
        name: 'Mrs. Sunita Gupta',
        phone: '+91-9876543216',
        relation: 'Spouse'
      },
      workSchedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '14:00' },
        sunday: { start: '10:00', end: '14:00' }
      },
      status: 'ACTIVE'
    }
  ],

  attendance: [
    // Today's attendance sample
    {
      staffId: 'DOC001',
      centerId: 'PHC001',
      date: new Date(),
      checkIn: {
        time: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        location: {
          lat: 28.6139,
          lng: 77.2090,
          accuracy: 10
        },
        biometricType: 'FINGERPRINT',
        deviceInfo: {
          deviceId: 'FP001',
          deviceType: 'Mantra MFS100',
          appVersion: '1.0.0'
        },
        verified: true
      },
      status: 'LATE',
      isLate: true,
      lateMinutes: 45
    },
    {
      staffId: 'DOC002',
      centerId: 'PHC002',
      date: new Date(),
      checkIn: {
        time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        location: {
          lat: 28.7041,
          lng: 77.1025,
          accuracy: 15
        },
        biometricType: 'FACIAL',
        deviceInfo: {
          deviceId: 'MOB001',
          deviceType: 'Android Phone',
          appVersion: '1.0.0'
        },
        verified: true
      },
      checkOut: {
        time: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        location: {
          lat: 28.7041,
          lng: 77.1025,
          accuracy: 12
        },
        biometricType: 'FACIAL',
        deviceInfo: {
          deviceId: 'MOB001',
          deviceType: 'Android Phone',
          appVersion: '1.0.0'
        },
        verified: true
      },
      totalWorkHours: 7.5,
      status: 'PRESENT'
    },
    {
      staffId: 'NUR001',
      centerId: 'SC001',
      date: new Date(),
      checkIn: {
        time: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        location: {
          lat: 28.5355,
          lng: 77.3910,
          accuracy: 20
        },
        biometricType: 'FINGERPRINT',
        deviceInfo: {
          deviceId: 'FP002',
          deviceType: 'Mantra MFS100',
          appVersion: '1.0.0'
        },
        verified: true
      },
      status: 'LATE',
      isLate: true,
      lateMinutes: 60
    }
  ],

  alerts: [
    {
      staffId: 'DOC001',
      centerId: 'PHC001',
      type: 'LATE_CHECKIN',
      severity: 'MEDIUM',
      title: 'Late Check-in Alert',
      message: 'Dr. Ramesh Kumar (Senior Medical Officer) at PHC001 checked in 45 minutes late',
      data: {
        expectedTime: new Date(new Date().setHours(9, 0, 0, 0)),
        actualTime: new Date(Date.now() - 45 * 60 * 1000),
        lateMinutes: 45
      },
      recipients: [
        {
          userId: 'ddhs_001',
          name: 'Dr. Ashok Kumar',
          role: 'DDHS',
          email: 'ddhs.central@ephc.gov',
          phone: '+91-11-23456780'
        }
      ],
      status: 'SENT',
      createdAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      staffId: 'NUR001',
      centerId: 'SC001',
      type: 'ABSENTEEISM',
      severity: 'HIGH',
      title: 'Multiple Staff Absences',
      message: '1 staff member is absent today at Sub-Centre Village A',
      data: {
        absentCount: 1,
        totalStaff: 3
      },
      recipients: [
        {
          userId: 'ddhs_002',
          name: 'Dr. Sunita Singh',
          role: 'DDHS',
          email: 'ddhs.south@ephc.gov',
          phone: '+91-11-23456781'
        }
      ],
      status: 'PENDING',
      createdAt: new Date(Date.now() - 60 * 60 * 1000)
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ephc');
    
    console.log('Clearing existing data...');
    await Center.deleteMany({});
    await Staff.deleteMany({});
    await Attendance.deleteMany({});
    await Alert.deleteMany({});

    console.log('Inserting sample centers...');
    await Center.insertMany(sampleData.centers);
    
    console.log('Inserting sample staff...');
    await Staff.insertMany(sampleData.staff);
    
    console.log('Inserting sample attendance...');
    await Attendance.insertMany(sampleData.attendance);
    
    console.log('Inserting sample alerts...');
    await Alert.insertMany(sampleData.alerts);

    console.log('Creating indexes for better performance...');
    // Create indexes using the model methods
    try {
      await Center.createIndex({ centerId: 1 }, { unique: true });
      await Staff.createIndex({ staffId: 1 }, { unique: true });
      await Staff.createIndex({ centerId: 1 });
      await Attendance.createIndex({ staffId: 1, date: -1 });
      await Attendance.createIndex({ centerId: 1, date: -1 });
      await Alert.createIndex({ centerId: 1, createdAt: -1 });
      await Alert.createIndex({ staffId: 1, createdAt: -1 });
      console.log('Indexes created successfully!');
    } catch (indexError) {
      console.error('Error creating indexes:', indexError);
    }

    console.log('Database seeded successfully!');
    console.log('\nSample data created:');
    console.log(`- Centers: ${sampleData.centers.length}`);
    console.log(`- Staff: ${sampleData.staff.length}`);
    console.log(`- Attendance records: ${sampleData.attendance.length}`);
    console.log(`- Alerts: ${sampleData.alerts.length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleData };
