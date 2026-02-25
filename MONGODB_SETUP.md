# MongoDB Setup for e-PHC Connect

## Prerequisites
1. Install MongoDB Community Server on your machine
2. Install MongoDB Compass (the GUI for MongoDB)

## MongoDB Installation

### macOS (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Or run manually
mongod --config /usr/local/etc/mongod.conf --fork
```

### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Configure MongoDB as a Windows service

## MongoDB Compass Setup

### Download and Install
1. Download MongoDB Compass from https://www.mongodb.com/try/download/compass
2. Install the application
3. Launch MongoDB Compass

## Configuration

### 1. Create Connection in Compass
Open MongoDB Compass and create a new connection with these settings:

**Connection String:**
```
mongodb://localhost:27017/ephc
```

**Advanced Connection Options:**
```
{
  "serverSelectionTimeoutMS": 5000,
  "socketTimeoutMS": 45000,
  "maxPoolSize": 50,
  "useNewUrlParser": true,
  "useUnifiedTopology": true
}
```

### 2. Environment Variables
Update your backend `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ephc
MONGODB_DB_NAME=ephc

# For development with authentication (optional)
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
```

## Database Schema Overview

Once connected, you'll see these collections:

### Collections
1. **centers** - Health center information
2. **staff** - Staff members and their biometric data
3. **attendance** - Daily attendance records
4. **alerts** - System-generated alerts

### Sample Documents

#### Center Document
```json
{
  "_id": "641f8a1b2c3e4a8b4567",
  "centerId": "PHC001",
  "name": "Primary Health Center - Urban",
  "type": "PHC",
  "division": "Central Division",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "operatingHours": {
    "start": "09:00",
    "end": "17:00"
  },
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Staff Document
```json
{
  "_id": "641f8a1b2c3e4a8b4568",
  "staffId": "DOC001",
  "name": "Dr. Ramesh Kumar",
  "email": "ramesh.kumar@ephc.gov",
  "role": "DOCTOR",
  "centerId": "PHC001",
  "biometricData": {
    "fingerprintHash": "$2b$12$hashed_value...",
    "facialRecognitionHash": "$2b$12$hashed_value..."
  },
  "status": "ACTIVE"
}
```

#### Attendance Document
```json
{
  "_id": "641f8a1b2c3e4a8b4569",
  "staffId": "DOC001",
  "centerId": "PHC001",
  "date": "2024-01-15T00:00:00.000Z",
  "checkIn": {
    "time": "2024-01-15T09:45:00.000Z",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "biometricType": "FINGERPRINT",
    "verified": true
  },
  "status": "LATE",
  "lateMinutes": 45
}
```

## Running the Application

### 1. Start MongoDB
```bash
# macOS
brew services start mongodb/brew/mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### 2. Start Backend Server
```bash
cd ephc-connect/backend
npm start
```

### 3. Start Frontend
```bash
cd ephc-connect/frontend
npm start
```

## MongoDB Compass Features to Use

### 1. Query Builder
- Build complex queries to find attendance patterns
- Filter by date ranges, center types, staff roles
- Aggregate data for reporting

### 2. Index Management
```javascript
// Create indexes for better performance
db.attendance.createIndex({ "staffId": 1, "date": -1 })
db.alerts.createIndex({ "centerId": 1, "createdAt": -1 })
db.centers.createIndex({ "division": 1, "type": 1 })
```

### 3. Aggregation Pipeline
```javascript
// Get attendance statistics by center
db.attendance.aggregate([
  {
    $match: {
      "date": {
        $gte: ISODate("2024-01-01"),
        $lt: ISODate("2024-01-31")
      }
    }
  },
  {
    $group: {
      "_id": "$centerId",
      "totalStaff": { $sum: 1 },
      "presentStaff": {
        $sum: {
          $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0]
        }
      },
      "absentStaff": {
        $sum: {
          $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
        }
      }
    }
  }
])
```

### 4. Real-time Monitoring
- Use Compass Change Streams to monitor live data
- Set up watches on critical collections
- Export query results for analysis

## Sample Queries for Common Tasks

### 1. Find All Late Check-ins Today
```javascript
db.attendance.find({
  "date": {
    $gte: ISODate(new Date().setHours(0,0,0,0))
  },
  "status": "LATE"
}).sort({ "checkIn.time": -1 })
```

### 2. Get Active Alerts
```javascript
db.alerts.find({
  "status": { $in: ["PENDING", "SENT"] }
}).sort({ "createdAt": -1 }).limit(50)
```

### 3. Staff Performance Analysis
```javascript
db.attendance.aggregate([
  {
    $match: {
      "date": {
        $gte: ISODate("2024-01-01"),
        $lt: ISODate("2024-01-31")
      }
    }
  },
  {
    $group: {
      "_id": "$staffId",
      "totalDays": { $sum: 1 },
      "presentDays": {
        $sum: { $cond: [{ $in: ["$status", ["PRESENT", "LATE"] }, 1, 0] }
      },
      "lateDays": {
        $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] }
      }
    }
  },
  {
    $lookup: {
      "from": "staff",
      "localField": "_id",
      "foreignField": "staffId",
      "as": "staffInfo"
    }
  }
])
```

## Troubleshooting

### Connection Issues
1. **MongoDB not running**: Start the MongoDB service
2. **Port 27017 blocked**: Check firewall settings
3. **Authentication failed**: Verify username/password in connection string
4. **Database not found**: Create the `ephc` database first

### Performance Tips
1. **Create appropriate indexes** on frequently queried fields
2. **Use aggregation pipelines** for complex analytics
3. **Limit result sets** with pagination for large datasets
4. **Monitor connection pool** settings for high traffic

## Security Considerations

1. **Enable Authentication**: Create MongoDB users with appropriate roles
2. **Use SSL/TLS**: For production environments
3. **Network Access**: Restrict to specific IP addresses
4. **Regular Backups**: Schedule automated backups

## Data Export/Import

### Export Sample Data
```bash
# Export all collections
mongodump --db ephc --out ./backup/

# Export specific collection
mongodump --db ephc --collection centers --out ./centers_backup/
```

### Import Sample Data
```bash
# Import collections
mongorestore --db ephc ./backup/centers.bson
```

This setup will allow you to use MongoDB Compass effectively to monitor, query, and manage your e-PHC Connect application data.
