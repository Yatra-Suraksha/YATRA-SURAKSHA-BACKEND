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
    validateLocationHistoryParams,
    validateTouristForLocationUpdate
} from '../middlewares/validation.middleware.js'
import { 
    validateGeofenceData 
} from '../middlewares/geofence.middleware.js'

const router = Router()
router.use(sanitizeInput)

router.post('/location/update/me', 
    validateCoordinates, 
    validateTouristForLocationUpdate,
    updateLocation
)
router.post('/location/update', 
    validateObjectId('touristId'), 
    validateCoordinates, 
    validateTouristForLocationUpdate, 
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
    validateObjectId('touristId'), 
    validateTouristExists,
    validateLocationHistoryParams,
    getUserLocationHistory
)
router.get('/stats', getTouristStats)
router.get('/devices/connected', getConnectedDevices)
router.get('/alerts/active', 
    validatePagination, 
    getActiveAlerts
)
router.post('/alerts/acknowledge/:alertId', 
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
    validatePagination, 
    getGeofences
)
router.post('/geofences', 
    validateGeofenceData,
    createGeofence
)
router.put('/geofences/:fenceId', 
    validateObjectId('fenceId'), 
    validateGeofenceExists,
    validateGeofenceData, 
    updateGeofence
)
router.delete('/geofences/:fenceId', 
    validateObjectId('fenceId'), 
    validateGeofenceExists, 
    deleteGeofence
)

export default router