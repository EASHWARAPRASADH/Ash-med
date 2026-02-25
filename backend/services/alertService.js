// Initialize services only if credentials are valid
let twilio = null;
let sgMail = null;

if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  if (process.env.TWILIO_SID.startsWith('AC')) {
    twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  }
}

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const Alert = require('../models/Alert');
const Staff = require('../models/Staff');

class AlertService {
  constructor() {
    this.io = null; // Will be set from server.js
  }

  setSocketIO(io) {
    this.io = io;
  }

  // Send late check-in alert
  async sendLateAlert(staff, center, checkInTime, lateMinutes) {
    try {
      const recipients = await this.getDDHSContactsForCenter(center.centerId);
      
      const alert = new Alert({
        staffId: staff.staffId,
        centerId: center.centerId,
        type: 'LATE_CHECKIN',
        severity: lateMinutes > 60 ? 'HIGH' : 'MEDIUM',
        title: `Late Check-in Alert`,
        message: `Dr. ${staff.name} (${staff.designation}) at ${center.name} checked in ${lateMinutes} minutes late at ${checkInTime.toLocaleTimeString()}`,
        data: {
          expectedTime: this.getExpectedCheckInTime(center),
          actualTime: checkInTime,
          lateMinutes
        },
        recipients: recipients.map(r => ({
          userId: r.userId,
          name: r.name,
          role: r.role,
          email: r.email,
          phone: r.phone
        }))
      });

      await alert.save();

      // Send notifications to all recipients
      for (const recipient of recipients) {
        await this.sendNotifications(alert, recipient);
      }

      // Send real-time dashboard notification
      this.sendDashboardNotification(alert);

      console.log(`Late check-in alert sent for staff ${staff.staffId}`);
      return alert;
    } catch (error) {
      console.error('Error sending late alert:', error);
      throw error;
    }
  }

  // Send early departure alert
  async sendEarlyDepartureAlert(staff, center, checkOutTime, earlyMinutes) {
    try {
      const recipients = await this.getDDHSContactsForCenter(center.centerId);
      
      const alert = new Alert({
        staffId: staff.staffId,
        centerId: center.centerId,
        type: 'EARLY_CHECKOUT',
        severity: earlyMinutes > 120 ? 'HIGH' : 'MEDIUM',
        title: `Early Check-out Alert`,
        message: `Dr. ${staff.name} (${staff.designation}) at ${center.name} checked out ${earlyMinutes} minutes early at ${checkOutTime.toLocaleTimeString()}`,
        data: {
          expectedTime: this.getExpectedCheckOutTime(center),
          actualTime: checkOutTime,
          earlyMinutes
        },
        recipients: recipients.map(r => ({
          userId: r.userId,
          name: r.name,
          role: r.role,
          email: r.email,
          phone: r.phone
        }))
      });

      await alert.save();

      // Send notifications to all recipients
      for (const recipient of recipients) {
        await this.sendNotifications(alert, recipient);
      }

      // Send real-time dashboard notification
      this.sendDashboardNotification(alert);

      console.log(`Early departure alert sent for staff ${staff.staffId}`);
      return alert;
    } catch (error) {
      console.error('Error sending early departure alert:', error);
      throw error;
    }
  }

  // Create biometric failure alert
  async createBiometricFailureAlert(staffId, centerId, biometricType) {
    try {
      const recipients = await this.getDDHSContactsForCenter(centerId);
      const staff = await Staff.findOne({ staffId });
      const center = await Center.findOne({ centerId });
      
      const alert = new Alert({
        staffId,
        centerId,
        type: 'BIOMETRIC_FAILURE',
        severity: 'HIGH',
        title: `Biometric Verification Failed`,
        message: `Biometric verification failed for ${staff.name} using ${biometricType} at ${center.name}`,
        data: {
          biometricType
        },
        recipients: recipients.map(r => ({
          userId: r.userId,
          name: r.name,
          role: r.role,
          email: r.email,
          phone: r.phone
        }))
      });

      await alert.save();
      await this.sendNotificationsToAll(alert);
      this.sendDashboardNotification(alert);

      return alert;
    } catch (error) {
      console.error('Error creating biometric failure alert:', error);
      throw error;
    }
  }

  // Send notifications to a single recipient
  async sendNotifications(alert, recipient) {
    const results = {
      sms: false,
      email: false,
      push: false
    };

    try {
      // Send SMS
      if (recipient.phone) {
        await this.sendSMS(alert, recipient.phone);
        results.sms = true;
      }
    } catch (error) {
      console.error(`SMS failed for ${recipient.phone}:`, error.message);
    }

    try {
      // Send Email
      if (recipient.email) {
        await this.sendEmail(alert, recipient.email, recipient.name);
        results.email = true;
      }
    } catch (error) {
      console.error(`Email failed for ${recipient.email}:`, error.message);
    }

    try {
      // Send Push Notification (via WebSocket)
      if (recipient.userId && this.io) {
        this.io.to(recipient.userId).emit('newAlert', {
          id: alert._id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          timestamp: alert.createdAt
        });
        results.push = true;
      }
    } catch (error) {
      console.error(`Push notification failed for ${recipient.userId}:`, error.message);
    }

    // Update alert with notification status
    await Alert.updateOne(
      { _id: alert._id, 'recipients.userId': recipient.userId },
      {
        $set: {
          'recipients.$.notified.sms': results.sms,
          'recipients.$.notified.email': results.email,
          'recipients.$.notified.push': results.push
        }
      }
    );

    return results;
  }

  // Send SMS notification
  async sendSMS(alert, phoneNumber) {
    if (!twilio) {
      console.log('SMS service not configured - skipping SMS to', phoneNumber);
      return null;
    }
    
    const message = await twilio.messages.create({
      body: `[${alert.severity}] ${alert.title}: ${alert.message}`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber
    });

    return message;
  }

  // Send Email notification
  async sendEmail(alert, emailAddress, recipientName) {
    if (!sgMail) {
      console.log('Email service not configured - skipping email to', emailAddress);
      return null;
    }
    const msg = {
      to: emailAddress,
      from: 'alerts@ephc.gov',
      subject: `[${alert.severity}] ${alert.title}`,
      text: `Dear ${recipientName},\n\n${alert.message}\n\nCenter ID: ${alert.centerId}\nStaff ID: ${alert.staffId}\nTime: ${alert.createdAt}\n\nPlease take appropriate action.\n\nRegards,\ne-PHC Connect System`,
      html: this.generateEmailHTML(alert, recipientName)
    };

    await sgMail.send(msg);
    return msg;
  }

  // Generate HTML email template
  generateEmailHTML(alert, recipientName) {
    const severityColors = {
      LOW: '#28a745',
      MEDIUM: '#ffc107',
      HIGH: '#fd7e14',
      CRITICAL: '#dc3545'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
          <h2>${alert.title}</h2>
          <p style="margin: 0; font-size: 14px;">Severity: ${alert.severity}</p>
        </div>
        <div style="padding: 20px; background-color: #f8f9fa;">
          <p>Dear ${recipientName},</p>
          <p>${alert.message}</p>
          <div style="background-color: white; padding: 15px; border-left: 4px solid ${severityColors[alert.severity]}; margin: 20px 0;">
            <p><strong>Details:</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Center ID:</strong> ${alert.centerId}</li>
              <li><strong>Staff ID:</strong> ${alert.staffId}</li>
              <li><strong>Time:</strong> ${alert.createdAt.toLocaleString()}</li>
              <li><strong>Alert Type:</strong> ${alert.type}</li>
            </ul>
          </div>
          <p>Please take appropriate action.</p>
          <p>Regards,<br>e-PHC Connect System</p>
        </div>
      </div>
    `;
  }

  // Send dashboard notification via WebSocket
  sendDashboardNotification(alert) {
    if (this.io) {
      this.io.emit('alertNotification', {
        id: alert._id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        centerId: alert.centerId,
        staffId: alert.staffId,
        timestamp: alert.createdAt
      });
    }
  }

  // Get DDHS contacts for a center
  async getDDHSContactsForCenter(centerId) {
    try {
      // In a real implementation, this would query a database or directory
      // For now, returning mock data
      const ddhsContacts = [
        {
          userId: 'ddhs_001',
          name: 'Dr. Ramesh Kumar',
          role: 'DDHS',
          email: 'ddhs@example.com',
          phone: '+919876543210'
        },
        {
          userId: 'center_manager_001',
          name: 'Smt. Priya Sharma',
          role: 'Center Manager',
          email: 'manager@example.com',
          phone: '+919876543211'
        }
      ];

      return ddhsContacts;
    } catch (error) {
      console.error('Error getting DDHS contacts:', error);
      return [];
    }
  }

  // Helper methods
  getExpectedCheckInTime(center) {
    const [hours, minutes] = center.operatingHours.start.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return time;
  }

  getExpectedCheckOutTime(center) {
    const [hours, minutes] = center.operatingHours.end.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return time;
  }

  // Send notifications to all recipients
  async sendNotificationsToAll(alert) {
    const promises = alert.recipients.map(recipient => 
      this.sendNotifications(alert, recipient)
    );
    await Promise.all(promises);
  }

  // Check for multiple absences and create aggregated alert
  async checkMultipleAbsences(centerId, date) {
    try {
      const Attendance = require('../models/Attendance');
      const absentStaff = await Attendance.find({
        centerId,
        date,
        status: 'ABSENT'
      }).populate('staffId', 'name role designation');

      if (absentStaff.length >= 3) { // Threshold for multiple absences
        const center = await Center.findOne({ centerId });
        const recipients = await this.getDDHSContactsForCenter(centerId);
        
        const alert = new Alert({
          centerId,
          type: 'MULTIPLE_ABSENCES',
          severity: absentStaff.length >= 5 ? 'CRITICAL' : 'HIGH',
          title: `Multiple Staff Absences`,
          message: `${absentStaff.length} staff members are absent today at ${center.name}`,
          data: {
            absentCount: absentStaff.length,
            absentStaff: absentStaff.map(s => ({
              name: s.staffId.name,
              role: s.staffId.role,
              designation: s.staffId.designation
            }))
          },
          recipients: recipients.map(r => ({
            userId: r.userId,
            name: r.name,
            role: r.role,
            email: r.email,
            phone: r.phone
          }))
        });

        await alert.save();
        await this.sendNotificationsToAll(alert);
        this.sendDashboardNotification(alert);

        return alert;
      }
    } catch (error) {
      console.error('Error checking multiple absences:', error);
    }
  }
}

// Create and export singleton instance
const alertService = new AlertService();
module.exports = alertService;
