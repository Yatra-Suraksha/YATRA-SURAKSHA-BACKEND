# Yatra Suraksha - Socket Endpoints Reference

## 📡 **Connection Management**

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | System | Initial socket connection established |
| `disconnect` | System | Client disconnection |

---

## 🔐 **Client Registration**

| Event | Direction | Data Structure | Description |
|-------|-----------|----------------|-------------|
| `join_admin` | Client → Server | `{ userId: string }` | Register as admin client |
| `join_tourist` | Client → Server | `{ touristId: string }` | Register as tourist client |

---

## 📍 **Location Tracking**

### **Incoming Events** (Client → Server)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `location_update` | `{ touristId: string, latitude: number, longitude: number, accuracy?: number, timestamp?: string, speed?: number, heading?: number, altitude?: number, batteryLevel?: number, source?: string }` | Send location data from tourist device |

### **Outgoing Events** (Server → Admins)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `tourist_location_update` | `{ touristId: string, latitude: number, longitude: number, accuracy: number, timestamp: Date, speed: number, batteryLevel: number }` | Broadcast location updates to admin clients |

---

## 🚨 **Emergency System**

### **Incoming Events** (Client → Server)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `emergency_alert` | `{ touristId: string, latitude: number, longitude: number, type?: string, message?: string }` | Report emergency situation |

### **Outgoing Events** (Server → Admins)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `emergency_alert` | `{ alertId: string, touristId: string, type: string, severity: 'emergency', location: { latitude, longitude }, timestamp: Date, message: string }` | Broadcast emergency alerts to admin clients |

---

## 🔶 **Geofence Monitoring**

### **Outgoing Events** (Server → Admins)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `geofence_alert` | `{ alertId: string, touristId: string, type: 'entry' \| 'exit', fenceName: string, fenceType: string, severity: string, location: { latitude, longitude }, timestamp: Date }` | Alert when tourist enters/exits geofences |

---

## 🔋 **Device Management**

### **Incoming Events** (Client → Server)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `device_status` | `{ deviceId: string, touristId: string, batteryLevel: number, signalStrength?: number, isCharging?: boolean, temperature?: number }` | Send device health metrics |

### **Outgoing Events** (Server → Admins)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `device_alert` | `{ alertId: string, touristId: string, type: 'battery_low', batteryLevel: number, timestamp: Date }` | Device-related alerts (low battery, etc.) |
| `inactivity_alert` | `{ alertId: string, touristId: string, touristName: string, deviceId: string, lastSeen: Date, timestamp: Date }` | Alert for inactive devices (30+ minutes) |

---

## 💓 **Health Monitoring**

### **Bidirectional Events**

| Event | Direction | Data Structure | Description |
|-------|-----------|----------------|-------------|
| `heartbeat` | Client → Server | `{ timestamp: Date }` | Client heartbeat signal |
| `heartbeat_ack` | Server → Client | `{ timestamp: Date }` | Acknowledgment of heartbeat |

### **Error Handling**

| Event | Direction | Data Structure | Description |
|-------|-----------|----------------|-------------|
| `error` | Server → Client | `{ message: string }` | Error responses from server |

---

## 📊 **Admin Dashboard Statistics**

### **Outgoing Events** (Server → Admins)

| Event | Data Structure | Description |
|-------|----------------|-------------|
| `current_stats` | `{ totalTourists: number, activeTourists: number, emergencyAlerts: number, recentAlerts: number, connectedDevices: number, connectedClients: number, adminClients: number, timestamp: Date }` | Initial stats when admin joins |
| `stats_update` | Same as `current_stats` | Real-time stats updates (every 30 seconds) |

---

## 🔄 **Background Processes**

| Process | Frequency | Description |
|---------|-----------|-------------|
| Stats Broadcasting | Every 30 seconds | Automatic `stats_update` to all admin clients |
| Inactive Device Check | Every 5 minutes | Check for devices inactive >30 minutes and send `inactivity_alert` |

---

## 📋 **Event Summary by Client Type**

### **Tourist App Events**
**Emit (Send):**
- `join_tourist`
- `location_update`
- `emergency_alert`
- `device_status`
- `heartbeat`

**Listen (Receive):**
- `heartbeat_ack`
- `error`

### **Admin Dashboard Events**
**Emit (Send):**
- `join_admin`
- `heartbeat`

**Listen (Receive):**
- `current_stats`
- `stats_update`
- `tourist_location_update`
- `emergency_alert`
- `geofence_alert`
- `device_alert`
- `inactivity_alert`
- `heartbeat_ack`
- `error`

---

## 🌐 **Connection Details**

- **Server URL**: `http://localhost:3000` (Development) | `https://your-domain.com` (Production)
- **Transport**: WebSocket with Polling fallback
- **Library**: Socket.IO
- **Authentication**: Firebase token required for some endpoints
- **Real-time Features**: Location tracking, Emergency alerts, Geofence monitoring, Device status