# Yatra Suraksha - Socket.IO Frontend Integration Guide

## 📋 Overview

This document provides complete instructions for integrating Socket.IO real-time communication with the Yatra Suraksha backend. The system supports two types of clients: **Tourist Apps** and **Admin Dashboard**.

## 🔧 Setup & Connection

### Installation
```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Basic Connection
```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  autoConnect: true
})
```

### Production Connection
```javascript
const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
})
```

---

## 🚶‍♂️ Tourist App Integration

### 1. Initial Connection & Registration
```javascript
// Connect and register as tourist
socket.on('connect', () => {
  console.log('Connected to server:', socket.id)
  
  // Register as tourist
  socket.emit('join_tourist', {
    touristId: 'user_firebase_uid_here' // Use Firebase UID
  })
})
```

### 2. Send Location Updates
```javascript
// Send location data to server
const sendLocationUpdate = (locationData) => {
  socket.emit('location_update', {
    touristId: 'user_firebase_uid',
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    accuracy: locationData.accuracy || 10,
    timestamp: new Date().toISOString(),
    speed: locationData.speed || 0,
    heading: locationData.heading || 0,
    altitude: locationData.altitude || 0,
    batteryLevel: getBatteryLevel(), // Your battery function
    source: 'gps' // 'gps', 'network', 'manual'
  })
}

// Example: Send location every 30 seconds
setInterval(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      sendLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed
      })
    })
  }
}, 30000)
```

### 3. Send Emergency Alerts
```javascript
// Panic button functionality
const sendEmergencyAlert = (currentLocation) => {
  socket.emit('emergency_alert', {
    touristId: 'user_firebase_uid',
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    type: 'panic_button', // 'panic_button', 'medical', 'theft', etc.
    message: 'Emergency assistance needed!'
  })
}

// Usage
document.getElementById('panicButton').addEventListener('click', () => {
  getCurrentLocation().then(location => {
    sendEmergencyAlert(location)
  })
})
```

### 4. Send Device Status
```javascript
// Send device health metrics
const sendDeviceStatus = () => {
  socket.emit('device_status', {
    deviceId: getDeviceId(), // Unique device identifier
    touristId: 'user_firebase_uid',
    batteryLevel: getBatteryLevel(),
    signalStrength: getSignalStrength(), // Optional
    isCharging: isDeviceCharging(), // Optional
    temperature: getDeviceTemperature() // Optional
  })
}

// Send device status every 5 minutes
setInterval(sendDeviceStatus, 5 * 60 * 1000)
```

### 5. Handle Server Responses
```javascript
// Handle errors from server
socket.on('error', (error) => {
  console.error('Socket error:', error)
  showErrorMessage(error.message)
})

// Handle heartbeat
socket.on('heartbeat_ack', (data) => {
  console.log('Server heartbeat received:', data.timestamp)
})

// Handle connection issues
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error)
  showConnectionError()
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason)
  showDisconnectionMessage()
})
```

### 6. Heartbeat Implementation
```javascript
// Send heartbeat every 30 seconds
setInterval(() => {
  if (socket.connected) {
    socket.emit('heartbeat', {
      timestamp: new Date()
    })
  }
}, 30000)
```

---

## 👨‍💼 Admin Dashboard Integration

### 1. Initial Connection & Registration
```javascript
// Connect and register as admin
socket.on('connect', () => {
  console.log('Admin connected:', socket.id)
  
  // Register as admin
  socket.emit('join_admin', {
    userId: 'admin_user_id' // Admin user identifier
  })
})
```

### 2. Listen for Real-time Events

#### Tourist Location Updates
```javascript
socket.on('tourist_location_update', (data) => {
  console.log('Tourist location update:', data)
  /*
  Data structure:
  {
    touristId: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    timestamp: Date,
    speed: number,
    batteryLevel: number
  }
  */
  
  // Update map marker
  updateTouristLocationOnMap(data)
  
  // Update tourist list
  updateTouristInList(data.touristId, data)
})
```

#### Emergency Alerts
```javascript
socket.on('emergency_alert', (data) => {
  console.log('EMERGENCY ALERT:', data)
  /*
  Data structure:
  {
    alertId: string,
    touristId: string,
    type: string,
    severity: 'emergency',
    location: { latitude, longitude },
    timestamp: Date,
    message: string
  }
  */
  
  // Show emergency notification
  showEmergencyNotification(data)
  
  // Add to emergency alerts list
  addToEmergencyAlerts(data)
  
  // Center map on emergency location
  centerMapOnLocation(data.location)
})
```

#### Geofence Alerts
```javascript
socket.on('geofence_alert', (data) => {
  console.log('Geofence alert:', data)
  /*
  Data structure:
  {
    alertId: string,
    touristId: string,
    type: 'entry' | 'exit',
    fenceName: string,
    fenceType: string,
    severity: string,
    location: { latitude, longitude },
    timestamp: Date
  }
  */
  
  // Show geofence notification
  showGeofenceAlert(data)
  
  // Update geofence status
  updateGeofenceStatus(data)
})
```

#### Device Alerts
```javascript
socket.on('device_alert', (data) => {
  console.log('Device alert:', data)
  /*
  Data structure:
  {
    alertId: string,
    touristId: string,
    type: 'battery_low',
    batteryLevel: number,
    timestamp: Date
  }
  */
  
  // Show device warning
  showDeviceAlert(data)
})
```

#### Inactivity Alerts
```javascript
socket.on('inactivity_alert', (data) => {
  console.log('Inactivity alert:', data)
  /*
  Data structure:
  {
    alertId: string,
    touristId: string,
    touristName: string,
    deviceId: string,
    lastSeen: Date,
    timestamp: Date
  }
  */
  
  // Show inactivity warning
  showInactivityAlert(data)
})
```

### 3. Real-time Statistics
```javascript
// Initial stats when admin connects
socket.on('current_stats', (stats) => {
  console.log('Current stats:', stats)
  updateDashboardStats(stats)
})

// Periodic stats updates (every 30 seconds)
socket.on('stats_update', (stats) => {
  console.log('Stats update:', stats)
  /*
  Stats structure:
  {
    totalTourists: number,
    activeTourists: number,
    emergencyAlerts: number,
    recentAlerts: number,
    connectedDevices: number,
    connectedClients: number,
    adminClients: number,
    timestamp: Date
  }
  */
  
  updateDashboardStats(stats)
})
```

---

## 🔄 Complete Integration Examples

### Tourist App (React/React Native)
```javascript
// hooks/useSocket.js
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export const useSocket = (touristId) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL)
    
    newSocket.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
      
      // Register as tourist
      newSocket.emit('join_tourist', { touristId })
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnected(false)
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    setSocket(newSocket)

    return () => newSocket.close()
  }, [touristId])

  const sendLocation = (locationData) => {
    if (socket && connected) {
      socket.emit('location_update', {
        touristId,
        ...locationData,
        timestamp: new Date().toISOString()
      })
    }
  }

  const sendEmergency = (location, type = 'panic_button') => {
    if (socket && connected) {
      socket.emit('emergency_alert', {
        touristId,
        latitude: location.latitude,
        longitude: location.longitude,
        type,
        message: 'Emergency assistance needed!'
      })
    }
  }

  return {
    socket,
    connected,
    sendLocation,
    sendEmergency
  }
}
```

### Admin Dashboard (React)
```javascript
// hooks/useAdminSocket.js
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export const useAdminSocket = (adminId) => {
  const [socket, setSocket] = useState(null)
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [touristLocations, setTouristLocations] = useState(new Map())

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL)
    
    newSocket.on('connect', () => {
      console.log('Admin connected')
      newSocket.emit('join_admin', { userId: adminId })
    })

    // Stats updates
    newSocket.on('current_stats', setStats)
    newSocket.on('stats_update', setStats)

    // Location updates
    newSocket.on('tourist_location_update', (data) => {
      setTouristLocations(prev => new Map(prev.set(data.touristId, data)))
    })

    // Alert handling
    newSocket.on('emergency_alert', (alert) => {
      setAlerts(prev => [alert, ...prev])
      // Show emergency notification
      showNotification('Emergency Alert', alert.message, 'error')
    })

    newSocket.on('geofence_alert', (alert) => {
      setAlerts(prev => [alert, ...prev])
      showNotification('Geofence Alert', `Tourist ${alert.type} ${alert.fenceName}`)
    })

    newSocket.on('device_alert', (alert) => {
      showNotification('Device Alert', `Low battery: ${alert.batteryLevel}%`, 'warning')
    })

    newSocket.on('inactivity_alert', (alert) => {
      showNotification('Inactivity Alert', `${alert.touristName} inactive for 30+ minutes`, 'warning')
    })

    setSocket(newSocket)

    return () => newSocket.close()
  }, [adminId])

  return {
    socket,
    stats,
    alerts,
    touristLocations: Array.from(touristLocations.values())
  }
}
```

---

## 🛠 Error Handling & Best Practices

### Connection Management
```javascript
const socket = io(SOCKET_URL, {
  autoConnect: false, // Manual connection control
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 10000
})

// Manual connection with retry logic
const connectSocket = () => {
  socket.connect()
}

// Graceful disconnection
const disconnectSocket = () => {
  socket.disconnect()
}
```

### Data Validation
```javascript
const sendLocationUpdate = (locationData) => {
  // Validate required fields
  if (!locationData.latitude || !locationData.longitude) {
    console.error('Invalid location data')
    return
  }

  // Validate coordinates
  if (Math.abs(locationData.latitude) > 90 || Math.abs(locationData.longitude) > 180) {
    console.error('Invalid coordinates')
    return
  }

  socket.emit('location_update', {
    touristId: getCurrentUserId(),
    latitude: Number(locationData.latitude),
    longitude: Number(locationData.longitude),
    accuracy: Number(locationData.accuracy) || 10,
    timestamp: new Date().toISOString()
  })
}
```

### Battery Optimization
```javascript
// Adaptive location update frequency based on battery level
const getUpdateInterval = (batteryLevel) => {
  if (batteryLevel < 20) return 60000  // 1 minute
  if (batteryLevel < 50) return 30000  // 30 seconds
  return 15000 // 15 seconds
}

// Dynamic interval adjustment
let updateInterval = setInterval(() => {
  const batteryLevel = getBatteryLevel()
  
  // Update interval based on battery
  clearInterval(updateInterval)
  updateInterval = setInterval(sendLocationUpdate, getUpdateInterval(batteryLevel))
  
  sendLocationUpdate()
}, 30000)
```

---

## 🚀 Testing Your Integration

### Test Socket Connection
```javascript
// Test connection
const testSocket = () => {
  const socket = io('http://localhost:3000')
  
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully')
    
    // Test tourist registration
    socket.emit('join_tourist', { touristId: 'test_user_123' })
    
    // Test location update
    socket.emit('location_update', {
      touristId: 'test_user_123',
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: 5,
      timestamp: new Date().toISOString()
    })
  })

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error)
  })
}
```

---

## 📱 Platform-Specific Considerations

### React Native
```javascript
// Install react-native-device-info for device metrics
import DeviceInfo from 'react-native-device-info'

const getBatteryLevel = async () => {
  try {
    return await DeviceInfo.getBatteryLevel() * 100
  } catch (error) {
    return 100 // Default value
  }
}

const getDeviceId = async () => {
  try {
    return await DeviceInfo.getUniqueId()
  } catch (error) {
    return 'unknown_device'
  }
}
```

### Flutter (Dart)
```dart
// Use socket_io_client package
dependencies:
  socket_io_client: ^2.0.3+1

// Connection
Socket socket = io('http://localhost:3000', <String, dynamic>{
  'transports': ['websocket'],
  'autoConnect': false,
});

// Connect and register
socket.connect();
socket.on('connect', (_) {
  socket.emit('join_tourist', {'touristId': 'user_id'});
});

// Send location
socket.emit('location_update', {
  'touristId': 'user_id',
  'latitude': position.latitude,
  'longitude': position.longitude,
  'timestamp': DateTime.now().toIso8601String()
});
```

---

## 🔒 Security Considerations

1. **Authentication**: Always verify user identity before emitting sensitive data
2. **Data Validation**: Validate all incoming data on the frontend
3. **Rate Limiting**: Don't spam the server with too frequent updates
4. **Error Handling**: Implement proper error handling for all socket events
5. **Connection Security**: Use HTTPS/WSS in production

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Connection Failed**: Check server URL and network connectivity
2. **Events Not Received**: Verify event names match exactly
3. **Data Not Updating**: Check if client is properly registered
4. **High Battery Usage**: Optimize update frequency

### Debug Mode
```javascript
// Enable debug logging
localStorage.debug = 'socket.io-client:socket'

// Or in code
const socket = io(SOCKET_URL, {
  debug: true
})
```

---

This guide provides everything your frontend developer needs to integrate Socket.IO with the Yatra Suraksha backend. All endpoints are tested and production-ready.