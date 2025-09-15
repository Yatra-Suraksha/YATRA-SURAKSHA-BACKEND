import { Router } from 'express'
import {
    updateLocation,
    getLocationHistory,
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
    getHeatmapData
} from '../controllers/tracking.controller.js'
import { verifyFirebaseToken } from '../middlewares/auth.middleware.js'

const router = Router()

// Location tracking endpoints
router.post('/location/update', updateLocation)
router.get('/location/history/:touristId', getLocationHistory)
router.get('/location/current/:touristId', getCurrentLocation)
router.get('/location/heatmap', getHeatmapData)
router.get('/location/nearby', getTouristsByLocation)

// Statistics and monitoring
router.get('/stats', getTouristStats)
router.get('/devices/connected', getConnectedDevices)

// Alert management
router.get('/alerts/active', getActiveAlerts)
router.post('/alerts/acknowledge/:alertId', acknowledgeAlert)
router.post('/alerts/emergency', createEmergencyAlert)

// Geofence management
router.get('/geofences', getGeofences)
router.post('/geofences', createGeofence)
router.put('/geofences/:fenceId', updateGeofence)
router.delete('/geofences/:fenceId', deleteGeofence)

export default router