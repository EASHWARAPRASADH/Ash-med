const crypto = require('crypto');

// Biometric verification utility
const verifyBiometric = async (staff, biometricType, providedHash) => {
  try {
    switch (biometricType.toUpperCase()) {
      case 'FINGERPRINT':
        return await staff.verifyBiometric('fingerprint', providedHash);
      
      case 'FACIAL':
        return await staff.verifyBiometric('facial', providedHash);
      
      case 'IRIS':
        return await staff.verifyBiometric('iris', providedHash);
      
      case 'MANUAL':
        // For manual check-ins, we might use a different verification method
        // This could be a PIN, password, or other verification
        return verifyManualCheckIn(staff, providedHash);
      
      default:
        console.warn(`Unknown biometric type: ${biometricType}`);
        return false;
    }
  } catch (error) {
    console.error('Biometric verification error:', error);
    return false;
  }
};

// Manual check-in verification (PIN-based)
const verifyManualCheckIn = async (staff, providedPin) => {
  try {
    // In a real implementation, this would verify against a stored PIN
    // For now, we'll use a simple hash comparison
    const storedPinHash = staff.manualPinHash; // This would need to be added to Staff model
    
    if (!storedPinHash) {
      console.warn(`No manual PIN stored for staff ${staff.staffId}`);
      return false;
    }
    
    const providedPinHash = crypto.createHash('sha256').update(providedPin).digest('hex');
    return storedPinHash === providedPinHash;
  } catch (error) {
    console.error('Manual verification error:', error);
    return false;
  }
};

// Generate biometric hash from raw data
const generateBiometricHash = (rawData, type) => {
  try {
    const algorithm = type === 'FACIAL' ? 'sha512' : 'sha256';
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash(algorithm)
      .update(rawData + salt)
      .digest('hex');
    
    return {
      hash,
      salt,
      algorithm
    };
  } catch (error) {
    console.error('Biometric hash generation error:', error);
    return null;
  }
};

// Verify location within acceptable radius
const verifyLocation = (expectedLocation, actualLocation, maxDistanceMeters = 100) => {
  try {
    if (!expectedLocation || !actualLocation) {
      return false;
    }
    
    const distance = calculateDistance(
      expectedLocation.lat,
      expectedLocation.lng,
      actualLocation.lat,
      actualLocation.lng
    );
    
    return distance <= maxDistanceMeters;
  } catch (error) {
    console.error('Location verification error:', error);
    return false;
  }
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Detect potential spoofing or tampering
const detectTampering = (deviceInfo, location, biometricData) => {
  const warnings = [];
  
  // Check for unusual device changes
  if (deviceInfo && deviceInfo.deviceId) {
    // In a real implementation, you'd compare with previous devices
    // For now, just log the device info
    console.log(`Device check: ${deviceInfo.deviceType} - ${deviceInfo.deviceId}`);
  }
  
  // Check for impossible travel times
  if (location && location.accuracy && location.accuracy > 1000) {
    warnings.push('Low GPS accuracy detected');
  }
  
  // Check biometric data quality (simplified)
  if (biometricData && biometricData.qualityScore && biometricData.qualityScore < 0.7) {
    warnings.push('Low biometric quality detected');
  }
  
  return {
    isSuspicious: warnings.length > 0,
    warnings
  };
};

// Rate limiting for biometric attempts
const biometricAttempts = new Map(); // In production, use Redis

const checkRateLimit = (staffId, maxAttempts = 5, windowMs = 300000) => {
  const now = Date.now();
  const attempts = biometricAttempts.get(staffId) || [];
  
  // Remove old attempts outside the window
  const validAttempts = attempts.filter(time => now - time < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return false; // Rate limited
  }
  
  // Add current attempt
  validAttempts.push(now);
  biometricAttempts.set(staffId, validAttempts);
  
  return true; // Allowed
};

module.exports = {
  verifyBiometric,
  generateBiometricHash,
  verifyLocation,
  calculateDistance,
  detectTampering,
  checkRateLimit
};
