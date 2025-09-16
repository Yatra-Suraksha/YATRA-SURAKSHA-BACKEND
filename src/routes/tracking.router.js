import { Router } from 'express'
import {
    updateLocation,
    getCurrentLocation,
    getTouristStats,
    getActiveAlerts,
    acknowledgeAlert,
    createGeofence,
    getGeofences,
    updateGeofence,
    deleteGeofence,
    getConnectedDevices,
    createEmergencyAlert,
    getTouristsByLocation,
    getHeatmapData,
    getUserLocationHistory,
    getMyLocationHistory
} from '../controllers/tracking.controller.js'
import { verifyFirebaseToken, optionalAuth } from '../middlewares/auth.middleware.js'
import { 
    validateTouristExists, 
    validateOrCreateTourist,
    validateCoordinates, 
    validateObjectId,
    validateAlertExists,
    validateGeofenceExists,
    sanitizeInput,
    validatePagination,
    validateLocationHistoryParams
} from '../middlewares/validation.middleware.js'

const router = Router()

// Apply input sanitization to all routes
router.use(sanitizeInput)

// Location tracking endpoints (require authentication)
// Route for updating current user's location (auto-detects tourist from auth)
router.post('/location/update/me', 
    verifyFirebaseToken,
    validateCoordinates, 
    validateOrCreateTourist, 
    updateLocation
)

// Original route with specific tourist ID (for admin/family access)
router.post('/location/update', 
    verifyFirebaseToken,
    validateObjectId('touristId'), 
    validateCoordinates, 
    validateTouristExists, 
    updateLocation
)

// Get current user's current location
router.get('/location/current/me', 
    verifyFirebaseToken,
    validateOrCreateTourist,
    getCurrentLocation
)
router.get('/location/current/:touristId', 
    verifyFirebaseToken,
    validateObjectId('touristId'), 
    validateTouristExists, 
    getCurrentLocation
)

// Public endpoints (no authentication required)
router.get('/location/heatmap', optionalAuth, getHeatmapData)
router.get('/location/nearby', optionalAuth, getTouristsByLocation)

// Location history endpoints (require authentication)
router.get('/location/history/me', 
    verifyFirebaseToken,
    validateLocationHistoryParams,
    getMyLocationHistory
)
router.get('/location/history/my', 
    verifyFirebaseToken,
    validateLocationHistoryParams,
    getMyLocationHistory
)
router.get('/location/history/:touristId', 
    verifyFirebaseToken,
    validateObjectId('touristId'), 
    validateTouristExists,
    validateLocationHistoryParams,
    getUserLocationHistory
)

// Statistics and monitoring (require authentication)
router.get('/stats', verifyFirebaseToken, getTouristStats)
router.get('/devices/connected', verifyFirebaseToken, getConnectedDevices)

// Alert management (require authentication)
router.get('/alerts/active', 
    verifyFirebaseToken, 
    validatePagination, 
    getActiveAlerts
)
router.post('/alerts/acknowledge/:alertId', 
    verifyFirebaseToken,
    validateAlertExists, 
    acknowledgeAlert
)

// Emergency alert for current user
router.post('/alerts/emergency/me', 
    verifyFirebaseToken,
    validateCoordinates, 
    validateOrCreateTourist, 
    createEmergencyAlert
)

// Emergency alert for specific tourist (admin/family use)
router.post('/alerts/emergency', 
    verifyFirebaseToken,
    validateCoordinates, 
    validateObjectId('touristId'), 
    validateTouristExists, 
    createEmergencyAlert
)

// Geofence management (require authentication)
router.get('/geofences', 
    verifyFirebaseToken, 
    validatePagination, 
    getGeofences
)
router.post('/geofences', verifyFirebaseToken, createGeofence)
router.put('/geofences/:fenceId', 
    verifyFirebaseToken,
    validateObjectId('fenceId'), 
    validateGeofenceExists, 
    updateGeofence
)
router.delete('/geofences/:fenceId', 
    verifyFirebaseToken,
    validateObjectId('fenceId'), 
    validateGeofenceExists, 
    deleteGeofence
)

export default router