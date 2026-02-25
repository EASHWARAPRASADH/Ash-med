import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  LocalHospital,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import io, { Socket } from 'socket.io-client';
import CentersMap from './CentersMap';
import AlertsPanel from './AlertsPanel';

interface DashboardStats {
  totalCenters: number;
  activeStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  alertsToday: number;
}

interface CenterStatus {
  centerId: string;
  name: string;
  type: string;
  division: string;
  totalStaff: number;
  presentStaff: number;
  absentStaff: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  lastUpdate: string;
}

interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCenters: 0,
    activeStaff: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    alertsToday: 0,
  });

  const [centers, setCenters] = useState<CenterStatus[]>([]);
  const [trends, setTrends] = useState<AttendanceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001');
    setSocket(newSocket);

    // Listen for real-time updates
    newSocket.on('centerUpdate', (data) => {
      setCenters(prev => prev.map(center => 
        center.centerId === data.centerId ? { ...center, ...data } : center
      ));
    });

    newSocket.on('newAlert', (alert) => {
      console.log('New alert received:', alert);
      setStats(prev => ({ ...prev, alertsToday: prev.alertsToday + 1 }));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Fetch real data from backend
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [statsRes, centersRes, trendsRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/attendance/stats`).then(r => r.json()),
          fetch(`${process.env.REACT_APP_API_URL}/centers/status`).then(r => r.json()),
          fetch(`${process.env.REACT_APP_API_URL}/attendance/trends`).then(r => r.json())
        ]);

        setStats(statsRes);
        setCenters(centersRes);
        setTrends(trendsRes);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep loading state false when API fails
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN':
        return 'success';
      case 'YELLOW':
        return 'warning';
      case 'RED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GREEN':
        return <CheckCircle color="success" />;
      case 'YELLOW':
        return <Warning color="warning" />;
      case 'RED':
        return <Error color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }> = ({ title, value, icon, color, trend }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
              {value.toLocaleString()}
            </Typography>
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend >= 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              backgroundColor: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Dashboard Overview
      </Typography>

      {/* Connection Status */}
      <Box sx={{ mb: 2 }}>
        <Chip 
          label={socket ? "🟢 Connected to Backend" : "🔴 Disconnected"} 
          color={socket ? "success" : "error"}
          variant="outlined"
        />
      </Box>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4 
      }}>
        <Box sx={{ 
          flex: '1 1 300px',
          minWidth: 280 
        }}>
          <StatCard
            title="Total Centers"
            value={stats.totalCenters}
            icon={<LocalHospital />}
            color="primary.main"
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px',
          minWidth: 280 
        }}>
          <StatCard
            title="Active Staff"
            value={stats.activeStaff}
            icon={<People />}
            color="secondary.main"
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px',
          minWidth: 280 
        }}>
          <StatCard
            title="Present Today"
            value={stats.presentToday}
            icon={<CheckCircle />}
            color="success.main"
            trend={5.2}
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px',
          minWidth: 280 
        }}>
          <StatCard
            title="Absent Today"
            value={stats.absentToday}
            icon={<Error />}
            color="error.main"
            trend={-12.5}
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px',
          minWidth: 280 
        }}>
          <StatCard
            title="Late Today"
            value={stats.lateToday}
            icon={<Warning />}
            color="warning.main"
            trend={8.1}
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px',
          minWidth: 280 
        }}>
          <StatCard
            title="Alerts Today"
            value={stats.alertsToday}
            icon={<Info />}
            color="info.main"
          />
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3 
      }}>
        {/* Attendance Trends Chart */}
        <Box sx={{ 
          flex: { xs: '1 1 auto', md: '8 1 auto' }
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Weekly Attendance Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#86868B" />
                  <YAxis stroke="#86868B" />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="#34C759"
                    strokeWidth={2}
                    dot={{ fill: '#34C759' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#FF3B30"
                    strokeWidth={2}
                    dot={{ fill: '#FF3B30' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="#FF9500"
                    strokeWidth={2}
                    dot={{ fill: '#FF9500' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Center Status List */}
        <Box sx={{ 
          flex: { xs: '1 1 auto', md: '4 1 auto' }
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Center Status
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {Array.isArray(centers) ? centers.map((center) => (
                  <Box
                    key={center.centerId}
                    sx={{
                      py: 2,
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {center.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {center.type} • {center.division}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <Tooltip title={`${center.presentStaff}/${center.totalStaff} present`}>
                          <Chip
                            label={`${center.presentStaff}/${center.totalStaff}`}
                            size="small"
                            color={getStatusColor(center.status) as any}
                            variant="outlined"
                          />
                        </Tooltip>
                        <Box sx={{ ml: 1 }}>
                          {getStatusIcon(center.status)}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )) : (
                  <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                    No center data available
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3 
      }}>
        {/* Map Preview */}
        <Box sx={{ 
          flex: { xs: '1 1 auto', md: '6 1 auto' }
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Centers Map
              </Typography>
              <Box sx={{ height: 300, borderRadius: 2, overflow: 'hidden' }}>
                <CentersMap compact={true} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Alerts */}
        <Box sx={{ 
          flex: { xs: '1 1 auto', md: '6 1 auto' }
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Alerts
              </Typography>
              <Box sx={{ height: 300, overflowY: 'auto' }}>
                <AlertsPanel compact={true} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
