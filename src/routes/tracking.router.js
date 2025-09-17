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
import { 
    requireAdminRole, 
    validateGeofenceData 
} from '../middlewares/geofence.middleware.js'

const router = Router()
router.use(sanitizeInput)

router.post('/location/update/me', 
    verifyFirebaseToken,
    validateCoordinates, 
    validateOrCreateTourist, 
    updateLocation
)
router.post('/location/update', 
    verifyFirebaseToken,
    validateObjectId('touristId'), 
    validateCoordinates, 
    validateTouristExists, 
    updateLocation
)
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
router.get('/location/heatmap', optionalAuth, getHeatmapData)
router.get('/location/nearby', optionalAuth, getTouristsByLocation)
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
router.get('/stats', verifyFirebaseToken, getTouristStats)
router.get('/devices/connected', verifyFirebaseToken, getConnectedDevices)
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
router.post('/alerts/emergency/me', 
    verifyFirebaseToken,
    validateCoordinates, 
    validateOrCreateTourist, 
    createEmergencyAlert
)
router.post('/alerts/emergency', 
    verifyFirebaseToken,
    validateCoordinates, 
    validateObjectId('touristId'), 
    validateTouristExists, 
    createEmergencyAlert
)
router.get('/geofences', 
    verifyFirebaseToken, 
    validatePagination, 
    getGeofences
)
router.post('/geofences', 
    verifyFirebaseToken, 
    requireAdminRole,
    validateGeofenceData,
    createGeofence
)
router.put('/geofences/:fenceId', 
    verifyFirebaseToken,
    requireAdminRole,
    validateObjectId('fenceId'), 
    validateGeofenceExists,
    validateGeofenceData, 
    updateGeofence
)
router.delete('/geofences/:fenceId', 
    verifyFirebaseToken,
    requireAdminRole,
    validateObjectId('fenceId'), 
    validateGeofenceExists, 
    deleteGeofence
)

export default router