import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  MoreVert,
  MarkEmailRead,
  DoneAll,
} from '@mui/icons-material';
import { format } from 'date-fns';
import io, { Socket } from 'socket.io-client';

interface Alert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  centerId: string;
  staffId: string;
  centerName?: string;
  staffName?: string;
  timestamp: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'RESOLVED';
}

interface AlertsPanelProps {
  compact?: boolean;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ compact = false }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('newAlert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    newSocket.on('alertUpdate', (updatedAlert) => {
      setAlerts(prev => prev.map(alert => 
        alert.id === updatedAlert.id ? { ...alert, ...updatedAlert } : alert
      ));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/alerts`);
        const alertsData = await response.json();
        
        const transformedAlerts = alertsData.map((alert: any) => ({
          id: alert._id || alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          centerId: alert.centerId,
          staffId: alert.staffId,
          centerName: alert.centerName,
          staffName: alert.staffName,
          timestamp: alert.createdAt || alert.timestamp,
          status: alert.status || 'PENDING',
        }));

        setAlerts(transformedAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/alerts/${alertId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current_user',
          userName: 'Admin User',
          userRole: 'admin'
        }),
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: action === 'acknowledge' ? 'ACKNOWLEDGED' : 'RESOLVED' }
            : alert
        ));
      }
    } catch (error) {
      console.error(`Error ${action}ing alert:`, error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'info';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'SENT':
        return 'info';
      case 'DELIVERED':
        return 'success';
      case 'ACKNOWLEDGED':
        return 'success';
      case 'RESOLVED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return <Info color="info" />;
      case 'MEDIUM':
        return <Warning color="warning" />;
      case 'HIGH':
      case 'CRITICAL':
        return <Error color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Warning color="warning" />;
      case 'SENT':
        return <MarkEmailRead color="info" />;
      case 'DELIVERED':
        return <DoneAll color="success" />;
      case 'ACKNOWLEDGED':
        return <CheckCircle color="success" />;
      case 'RESOLVED':
        return <CheckCircle color="success" />;
      default:
        return <Info color="info" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const maxHeight = compact ? 300 : 600;

  return (
    <Box sx={{ maxHeight, overflowY: 'auto' }}>
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between">
              <Box display="flex" alignItems="flex-start" flex={1}>
                <Box sx={{ mr: 2, mt: 0.5 }}>
                  {getSeverityIcon(alert.severity)}
                </Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mr: 1 }}>
                      {alert.title}
                    </Typography>
                    <Chip
                      label={alert.severity}
                      size="small"
                      color={getSeverityColor(alert.severity) as any}
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={alert.status}
                      size="small"
                      color={getStatusColor(alert.status) as any}
                      variant="filled"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {alert.message}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary">
                      {alert.centerName} • {formatTimeAgo(alert.timestamp)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {alert.status === 'PENDING' && (
                        <>
                          <Tooltip title="Acknowledge">
                            <IconButton 
                              size="small" 
                              onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                              color="primary"
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Resolve">
                            <IconButton 
                              size="small" 
                              onClick={() => handleAlertAction(alert.id, 'resolve')}
                              color="success"
                            >
                              <DoneAll fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {getStatusIcon(alert.status)}
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
                        {alert.status}
                      </Typography>
                    </Box>
                  </Box>
              </Box>
              <Tooltip title="More options">
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default AlertsPanel;
