import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Card, CardContent, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io, { Socket } from 'socket.io-client';

interface Center {
  centerId: string;
  name: string;
  type: string;
  division: string;
  location: {
    lat: number;
    lng: number;
  };
  totalStaff: number;
  presentStaff: number;
  absentStaff: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
}

interface CentersMapProps {
  compact?: boolean;
}

const CentersMap: React.FC<CentersMapProps> = ({ compact = false }) => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001');
    setSocket(newSocket);

    // Listen for real-time center updates
    newSocket.on('centerUpdate', (data) => {
      setCenters(prev => prev.map(center => 
        center.centerId === data.centerId ? { ...center, ...data } : center
      ));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Fetch real centers data from backend
    const fetchCenters = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/centers/status`);
        const centersData = await response.json();
        
        // Transform the data to match the expected format
        const transformedCenters = centersData.map((center: any) => ({
          centerId: center.centerId,
          name: center.name,
          type: center.type,
          division: center.division,
          location: center.location,
          totalStaff: center.totalStaff || 0,
          presentStaff: center.presentStaff || 0,
          absentStaff: center.absentStaff || 0,
          status: center.status || 'GREEN',
        }));

        setCenters(transformedCenters);
      } catch (error) {
        console.error('Error fetching centers for map:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCenters();
  }, []);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'GREEN':
        return '#34C759';
      case 'YELLOW':
        return '#FF9500';
      case 'RED':
        return '#FF3B30';
      default:
        return '#86868B';
    }
  };

  const createCustomIcon = (status: string) => {
    const color = getMarkerColor(status);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography>Loading map...</Typography>
      </Box>
    );
  }

  const mapHeight = compact ? 300 : 600;

  return (
    <Box height={mapHeight} position="relative">
      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={10}
        style={{ height: '100%', width: '100%', borderRadius: 12 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {centers.map((center) => (
          <Marker
            key={center.centerId}
            position={[center.location.lat, center.location.lng]}
            icon={createCustomIcon(center.status)}
          >
            <Popup>
              <Card sx={{ minWidth: 200, boxShadow: 'none' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {center.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {center.type} • {center.division}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Staff Present:</strong> {center.presentStaff}/{center.totalStaff}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong>{' '}
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getMarkerColor(center.status),
                          ml: 1,
                          verticalAlign: 'middle',
                        }}
                      />
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default CentersMap;
