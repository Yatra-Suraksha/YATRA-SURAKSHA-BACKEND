import { LocationHistory, Alert, Device } from '../models/tracking.model.js'
import Tourist from '../models/tourist.model.js'
import GeoFence from '../models/geoFence.model.js'
import geolib from 'geolib'
import { getConnectedClientsInfo } from '../services/socket.service.js'

/**
 * @swagger
 * /api/tracking/location/update:
 *   post:
 *     summary: Update tourist location
 *     tags: [Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - touristId
 *               - latitude
 *               - longitude
 *             properties:
 *               touristId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               accuracy:
 *                 type: number
 *               speed:
 *                 type: number
 *               heading:
 *                 type: number
 *               altitude:
 *                 type: number
 *               batteryLevel:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
export const updateLocation = async (req, res) => {
    try {
        const {
            touristId,
            latitude,
            longitude,
            accuracy = 10,
            speed = 0,
            heading = 0,
            altitude = 0,
            batteryLevel = 100,
            timestamp,
            source = 'gps'
        } = req.body

        // Validate required fields
        if (!touristId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Tourist ID, latitude, and longitude are required'
            })
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            })
        }

        // Check if tourist exists
        const tourist = await Tourist.findById(touristId)
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            })
        }

        // Store location in history
        const locationRecord = new LocationHistory({
            touristId,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // GeoJSON format
            },
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            accuracy,
            speed,
            heading,
            altitude,
            batteryLevel,
            source
        })

        await locationRecord.save()

        // Update tourist's current location and status
        await Tourist.findByIdAndUpdate(touristId, {
            currentLocation: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            lastLocationUpdate: new Date(),
            isActive: true
        })

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: {
                locationId: locationRecord._id,
                timestamp: locationRecord.timestamp
            }
        })

    } catch (error) {
        console.error('Error updating location:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update location'
        })
    }
}

/**
 * @swagger
 * /api/tracking/location/history/{touristId}:
 *   get:
 *     summary: Get location history for a tourist
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: touristId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: Location history retrieved successfully
 */
export const getLocationHistory = async (req, res) => {
    try {
        const { touristId } = req.params
        const { limit = 100, hours = 24 } = req.query

        const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

        const locations = await LocationHistory.find({
            touristId,
            timestamp: { $gte: startTime }
        })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean()

        const formattedLocations = locations.map(loc => ({
            id: loc._id,
            latitude: loc.location.coordinates[1],
            longitude: loc.location.coordinates[0],
            accuracy: loc.accuracy,
            speed: loc.speed,
            heading: loc.heading,
            altitude: loc.altitude,
            batteryLevel: loc.batteryLevel,
            timestamp: loc.timestamp,
            source: loc.source
        }))

        res.json({
            success: true,
            data: {
                touristId,
                locations: formattedLocations,
                count: formattedLocations.length
            }
        })

    } catch (error) {
        console.error('Error getting location history:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location history'
        })
    }
}

/**
 * @swagger
 * /api/tracking/location/current/{touristId}:
 *   get:
 *     summary: Get current location for a tourist
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: touristId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current location retrieved successfully
 */
export const getCurrentLocation = async (req, res) => {
    try {
        const { touristId } = req.params

        const tourist = await Tourist.findById(touristId).lean()
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            })
        }

        let currentLocation = null
        if (tourist.currentLocation && tourist.currentLocation.coordinates) {
            currentLocation = {
                latitude: tourist.currentLocation.coordinates[1],
                longitude: tourist.currentLocation.coordinates[0],
                lastUpdate: tourist.lastLocationUpdate
            }
        }

        res.json({
            success: true,
            data: {
                touristId,
                name: tourist.name,
                currentLocation,
                isActive: tourist.isActive,
                status: tourist.status
            }
        })

    } catch (error) {
        console.error('Error getting current location:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve current location'
        })
    }
}

/**
 * @swagger
 * /api/tracking/location/heatmap:
 *   get:
 *     summary: Get heatmap data for visualization
 *     tags: [Tracking]
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: Heatmap data retrieved successfully
 */
export const getHeatmapData = async (req, res) => {
    try {
        const { hours = 24 } = req.query
        const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

        const heatmapData = await LocationHistory.aggregate([
            {
                $match: {
                    timestamp: { $gte: startTime }
                }
            },
            {
                $group: {
                    _id: {
                        lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 4] },
                        lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 4] }
                    },
                    count: { $sum: 1 },
                    tourists: { $addToSet: '$touristId' }
                }
            },
            {
                $project: {
                    latitude: '$_id.lat',
                    longitude: '$_id.lng',
                    weight: '$count',
                    touristCount: { $size: '$tourists' },
                    _id: 0
                }
            },
            {
                $sort: { weight: -1 }
            }
        ])

        res.json({
            success: true,
            data: {
                heatmapData,
                count: heatmapData.length,
                timeRange: `${hours} hours`
            }
        })

    } catch (error) {
        console.error('Error getting heatmap data:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve heatmap data'
        })
    }
}

/**
 * @swagger
 * /api/tracking/stats:
 *   get:
 *     summary: Get tracking statistics
 *     tags: [Tracking]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
export const getTouristStats = async (req, res) => {
    try {
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        const [
            totalTourists,
            activeTourists,
            recentlyActive,
            emergencyAlerts,
            totalAlerts,
            connectedDevices,
            locationUpdatesLast24h
        ] = await Promise.all([
            Tourist.countDocuments(),
            Tourist.countDocuments({ 
                isActive: true, 
                lastLocationUpdate: { $gte: oneDayAgo } 
            }),
            Tourist.countDocuments({ 
                lastLocationUpdate: { $gte: oneHourAgo } 
            }),
            Alert.countDocuments({ 
                severity: 'emergency', 
                'acknowledgment.isAcknowledged': false 
            }),
            Alert.countDocuments({ 
                createdAt: { $gte: oneDayAgo } 
            }),
            Device.countDocuments({ 
                status: 'active', 
                'currentMetrics.lastPing': { $gte: oneDayAgo } 
            }),
            LocationHistory.countDocuments({ 
                timestamp: { $gte: oneDayAgo } 
            })
        ])

        const clientsInfo = getConnectedClientsInfo()

        res.json({
            success: true,
            data: {
                tourists: {
                    total: totalTourists,
                    active: activeTourists,
                    recentlyActive
                },
                alerts: {
                    emergency: emergencyAlerts,
                    total: totalAlerts
                },
                devices: {
                    connected: connectedDevices
                },
                tracking: {
                    locationUpdatesLast24h
                },
                realtime: {
                    connectedClients: clientsInfo.total,
                    adminClients: clientsInfo.admins,
                    touristClients: clientsInfo.tourists
                },
                timestamp: now
            }
        })

    } catch (error) {
        console.error('Error getting tourist stats:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics'
        })
    }
}

/**
 * @swagger
 * /api/tracking/alerts/active:
 *   get:
 *     summary: Get active alerts
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: Active alerts retrieved successfully
 */
export const getActiveAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({
            'acknowledgment.isAcknowledged': false
        })
        .populate('touristId', 'name phone nationality')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()

        const formattedAlerts = alerts.map(alert => ({
            id: alert._id,
            alertId: alert.alertId,
            tourist: alert.touristId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            location: alert.location ? {
                latitude: alert.location.coordinates[1],
                longitude: alert.location.coordinates[0]
            } : null,
            timestamp: alert.createdAt,
            metadata: alert.metadata
        }))

        res.json({
            success: true,
            data: {
                alerts: formattedAlerts,
                count: formattedAlerts.length
            }
        })

    } catch (error) {
        console.error('Error getting active alerts:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve active alerts'
        })
    }
}

/**
 * @swagger
 * /api/tracking/alerts/acknowledge/{alertId}:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               acknowledgedBy:
 *                 type: string
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 */
export const acknowledgeAlert = async (req, res) => {
    try {
        const { alertId } = req.params
        const { acknowledgedBy, response } = req.body

        const alert = await Alert.findOneAndUpdate(
            { alertId },
            {
                'acknowledgment.isAcknowledged': true,
                'acknowledgment.acknowledgedBy': acknowledgedBy,
                'acknowledgment.acknowledgedAt': new Date(),
                'acknowledgment.response': response
            },
            { new: true }
        )

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            })
        }

        res.json({
            success: true,
            message: 'Alert acknowledged successfully',
            data: { alertId }
        })

    } catch (error) {
        console.error('Error acknowledging alert:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge alert'
        })
    }
}

/**
 * @swagger
 * /api/tracking/alerts/emergency:
 *   post:
 *     summary: Create emergency alert
 *     tags: [Alerts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - touristId
 *               - latitude
 *               - longitude
 *             properties:
 *               touristId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Emergency alert created successfully
 */
export const createEmergencyAlert = async (req, res) => {
    try {
        const { touristId, latitude, longitude, message, type = 'panic_button' } = req.body

        if (!touristId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Tourist ID, latitude, and longitude are required'
            })
        }

        const alert = new Alert({
            alertId: `emergency_${Date.now()}_${touristId}`,
            touristId,
            type,
            severity: 'emergency',
            message: {
                english: message || 'Emergency alert triggered',
                hindi: 'आपातकालीन अलर्ट सक्रिय'
            },
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            metadata: {
                triggeredBy: 'api',
                source: 'rest_api'
            }
        })

        await alert.save()

        // Update tourist status
        await Tourist.findByIdAndUpdate(touristId, {
            status: 'emergency',
            lastEmergencyAlert: new Date()
        })

        res.json({
            success: true,
            message: 'Emergency alert created successfully',
            data: {
                alertId: alert.alertId,
                timestamp: alert.createdAt
            }
        })

    } catch (error) {
        console.error('Error creating emergency alert:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create emergency alert'
        })
    }
}

/**
 * @swagger
 * /api/tracking/geofences:
 *   get:
 *     summary: Get all geofences
 *     tags: [Geofences]
 *     responses:
 *       200:
 *         description: Geofences retrieved successfully
 */
export const getGeofences = async (req, res) => {
    try {
        const geofences = await GeoFence.find().lean()

        res.json({
            success: true,
            data: {
                geofences,
                count: geofences.length
            }
        })

    } catch (error) {
        console.error('Error getting geofences:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve geofences'
        })
    }
}

/**
 * @swagger
 * /api/tracking/geofences:
 *   post:
 *     summary: Create a new geofence
 *     tags: [Geofences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - coordinates
 *             properties:
 *               name:
 *                 type: string
 *               coordinates:
 *                 type: array
 *               type:
 *                 type: string
 *               alertLevel:
 *                 type: string
 *     responses:
 *       201:
 *         description: Geofence created successfully
 */
export const createGeofence = async (req, res) => {
    try {
        const { name, coordinates, type, description, radius } = req.body

        if (!name || !coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Name and coordinates are required'
            })
        }

        const geofence = new GeoFence({
            name,
            type: type || 'warning',
            description,
            geometry: {
                type: radius ? 'Circle' : 'Polygon',
                coordinates: radius ? coordinates : [coordinates],
                radius: radius
            },
            isActive: true
        })

        await geofence.save()

        res.status(201).json({
            success: true,
            message: 'Geofence created successfully',
            data: geofence
        })

    } catch (error) {
        console.error('Error creating geofence:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create geofence'
        })
    }
}

/**
 * @swagger
 * /api/tracking/geofences/{fenceId}:
 *   put:
 *     summary: Update a geofence
 *     tags: [Geofences]
 *     parameters:
 *       - in: path
 *         name: fenceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Geofence updated successfully
 */
export const updateGeofence = async (req, res) => {
    try {
        const { fenceId } = req.params
        const updates = req.body

        const geofence = await GeoFence.findByIdAndUpdate(
            fenceId,
            updates,
            { new: true }
        )

        if (!geofence) {
            return res.status(404).json({
                success: false,
                message: 'Geofence not found'
            })
        }

        res.json({
            success: true,
            message: 'Geofence updated successfully',
            data: geofence
        })

    } catch (error) {
        console.error('Error updating geofence:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update geofence'
        })
    }
}

/**
 * @swagger
 * /api/tracking/geofences/{fenceId}:
 *   delete:
 *     summary: Delete a geofence
 *     tags: [Geofences]
 *     parameters:
 *       - in: path
 *         name: fenceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Geofence deleted successfully
 */
export const deleteGeofence = async (req, res) => {
    try {
        const { fenceId } = req.params

        const geofence = await GeoFence.findByIdAndDelete(fenceId)

        if (!geofence) {
            return res.status(404).json({
                success: false,
                message: 'Geofence not found'
            })
        }

        res.json({
            success: true,
            message: 'Geofence deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting geofence:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete geofence'
        })
    }
}

/**
 * @swagger
 * /api/tracking/devices/connected:
 *   get:
 *     summary: Get connected devices information
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: Connected devices retrieved successfully
 */
export const getConnectedDevices = async (req, res) => {
    try {
        const devices = await Device.find({
            status: { $in: ['active', 'low_battery'] }
        })
        .populate('touristId', 'name phone')
        .lean()

        const clientsInfo = getConnectedClientsInfo()

        res.json({
            success: true,
            data: {
                devices,
                realtimeConnections: clientsInfo,
                count: devices.length
            }
        })

    } catch (error) {
        console.error('Error getting connected devices:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve connected devices'
        })
    }
}

/**
 * @swagger
 * /api/tracking/location/nearby:
 *   get:
 *     summary: Get tourists near a location
 *     tags: [Tracking]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 1000
 *     responses:
 *       200:
 *         description: Nearby tourists retrieved successfully
 */
export const getTouristsByLocation = async (req, res) => {
    try {
        const { latitude, longitude, radius = 1000 } = req.query

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            })
        }

        const tourists = await Tourist.find({
            currentLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            },
            isActive: true
        }).lean()

        const formattedTourists = tourists.map(tourist => ({
            id: tourist._id,
            name: tourist.name,
            phone: tourist.phone,
            nationality: tourist.nationality,
            status: tourist.status,
            location: tourist.currentLocation ? {
                latitude: tourist.currentLocation.coordinates[1],
                longitude: tourist.currentLocation.coordinates[0]
            } : null,
            lastUpdate: tourist.lastLocationUpdate
        }))

        res.json({
            success: true,
            data: {
                tourists: formattedTourists,
                count: formattedTourists.length,
                searchLocation: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                radius: parseInt(radius)
            }
        })

    } catch (error) {
        console.error('Error getting nearby tourists:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve nearby tourists'
        })
    }
}