# 🏥 Ash-med - EPHC Connect

Real-time Healthcare Management System with biometric attendance tracking and interactive mapping.

## ✨ Features

### 🗺️ Real-Time Map View
- **Live Health Center Locations**: Interactive map showing all health centers with real-time status
- **Color-Coded Status Indicators**: GREEN (operational), YELLOW (partial staff), RED (critical)
- **Socket.IO Integration**: Live updates when center status changes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🚨 Advanced Alerts Panel
- **Real-Time Alerts**: Instant notifications for attendance issues, biometric failures, and more
- **Interactive Management**: Acknowledge and resolve alerts with one click
- **Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL with appropriate visual indicators
- **Status Tracking**: PENDING → SENT → ACKNOWLEDGED → RESOLVED workflow

### 📊 Comprehensive Dashboard
- **Live Statistics**: Real-time attendance data across all centers
- **Trend Analysis**: Visual charts showing attendance patterns
- **Staff Overview**: Present/absent/late staff counts with drill-down capabilities
- **Alert Summary**: Today's alerts and quick action buttons

### 🔧 Technical Features
- **Real-Time Communication**: Socket.IO for instant updates
- **Biometric Integration**: Facial recognition and fingerprint support
- **Multi-Page Application**: Dashboard, Map, and Alerts views
- **Responsive UI**: Material-UI components with Apple-inspired design

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **Leaflet & React-Leaflet** for mapping
- **Socket.IO Client** for real-time updates
- **Recharts** for data visualization
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication (ready for implementation)
- **Helmet** for security
- **Morgan** for logging

### Real-Time Features
- **Live Attendance Tracking**: Instant updates when staff check in/out
- **Center Status Updates**: Real-time operational status changes
- **Alert Broadcasting**: Immediate notifications for critical events
- **Biometric Processing**: Face recognition and fingerprint verification

## 📁 Project Structure

```
ash-med/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions
│   └── server.js         # Express server
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.tsx       # Main application
│   │   └── index.tsx     # Entry point
│   └── public/           # Static assets
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EASHWARAPRASADH/Ash-med.git
   cd Ash-med
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup Environment Variables**
   
   Backend (`backend/.env`):
   ```env
   MONGODB_URI=mongodb://localhost:27017/ephc
   PORT=5001
   JWT_SECRET=your_jwt_secret_here
   FRONTEND_URL=http://localhost:3000
   ```
   
   Frontend (`frontend/.env`):
   ```env
   REACT_APP_API_URL=http://localhost:5001/api
   REACT_APP_SOCKET_URL=http://localhost:5001
   ```

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Seed Database**
   ```bash
   cd backend
   node seedDatabase.js
   ```

7. **Start Backend Server**
   ```bash
   npm start
   ```

8. **Start Frontend Application**
   ```bash
   cd ../frontend
   npm start
   ```

9. **Open Application**
   Visit http://localhost:3000 in your browser

## 📱 Application Views

### Dashboard (`/`)
- Overview of all health centers
- Real-time statistics
- Recent alerts
- Attendance trends

### Map View (`/map`)
- Interactive map with all health centers
- Color-coded status indicators
- Center details on click
- Real-time status updates

### Alerts Panel (`/alerts`)
- List of all alerts
- Filter by severity and status
- Acknowledge/resolve actions
- Real-time alert updates

## 🔌 API Endpoints

### Centers
- `GET /api/centers` - Get all centers
- `GET /api/centers/status` - Get centers with attendance status
- `GET /api/centers/:centerId` - Get specific center details

### Attendance
- `GET /api/attendance/stats` - Get attendance statistics
- `GET /api/attendance/trends` - Get attendance trends
- `POST /api/attendance/checkin` - Staff check-in
- `POST /api/attendance/checkout` - Staff check-out

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/:alertId` - Get specific alert
- `PUT /api/alerts/:alertId/acknowledge` - Acknowledge alert
- `PUT /api/alerts/:alertId/resolve` - Resolve alert

### Staff
- `GET /api/staff` - Get all staff
- `GET /api/staff/:staffId` - Get specific staff
- `POST /api/staff/biometric` - Biometric verification

## 🔄 Real-Time Events

### Socket.IO Events

#### Client → Server
- `join_room` - Join center-specific room
- `leave_room` - Leave center-specific room

#### Server → Client
- `centerUpdate` - Center status changed
- `newAlert` - New alert generated
- `alertUpdate` - Alert status updated
- `attendanceUpdate` - Attendance record updated

## 🎯 Key Features in Detail

### Biometric Attendance
- **Face Recognition**: Real-time facial verification
- **Fingerprint Scanning**: Secure fingerprint authentication
- **Liveness Detection**: Prevents photo/video spoofing
- **Multi-Factor**: Combined biometric verification

### Alert System
- **Automated Detection**: AI-powered anomaly detection
- **Multi-Channel**: SMS, email, and in-app notifications
- **Escalation**: Automatic escalation for critical alerts
- **Audit Trail**: Complete alert history and actions

### Center Management
- **Geo-Location**: Precise location tracking
- **Status Monitoring**: Real-time operational status
- **Staff Allocation**: Optimal staff distribution
- **Performance Metrics**: Center performance analytics

## 🔒 Security Features

- **Data Encryption**: End-to-end encryption for sensitive data
- **Access Control**: Role-based access management
- **Audit Logging**: Complete activity tracking
- **Secure APIs**: JWT-based authentication
- **Biometric Security**: Encrypted biometric templates

## 📊 Monitoring & Analytics

- **Real-Time Dashboards**: Live data visualization
- **Performance Metrics**: System and user performance
- **Attendance Analytics**: Detailed attendance patterns
- **Alert Analytics**: Alert frequency and resolution times
- **Center Performance**: Individual center metrics

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Frontend build
cd frontend && npm run build

# Backend production
cd backend && npm run prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Material-UI for excellent components
- Leaflet for mapping capabilities
- Socket.IO for real-time communication
- MongoDB for data storage

## 📞 Support

For support and queries:
- Create an issue on GitHub
- Email: support@ash-med.com
- Documentation: [Wiki](https://github.com/EASHWARAPRASADH/Ash-med/wiki)

---

**Built with ❤️ for Healthcare Management**
