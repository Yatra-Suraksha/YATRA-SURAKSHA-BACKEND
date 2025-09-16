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
 *     description: Update the current location of a tourist with GPS coordinates and metadata
 *     tags: [Tracking]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationUpdateRequest'
 *           example:
 *             touristId: "64f8a2b4c1d2e3f456789abc"
 *             latitude: 26.1445
 *             longitude: 91.7362
 *             accuracy: 5.2
 *             speed: 2.5
 *             heading: 180
 *             altitude: 56
 *             batteryLevel: 85
 *             source: "gps"
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         locationId:
 *                           type: string
 *                           description: Unique location record ID
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           description: Location update timestamp
 *             example:
 *               success: true
 *               message: "Location updated successfully"
 *               data:
 *                 locationId: "64f8a2b4c1d2e3f456789def"
 *                 timestamp: "2025-09-16T08:15:30Z"
 *       400:
 *         description: Bad request - Invalid coordinates or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tourist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
            timestamp: new Date(), // Always use server timestamp for security
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

        // Validate if tourist exists
        const tourist = await Tourist.findById(touristId)
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            })
        }

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
                touristName: tourist.personalInfo?.name || 'Unknown',
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

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            })
        }

        // Validate if tourist exists BEFORE creating alert
        const tourist = await Tourist.findById(touristId)
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
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

        // Update tourist status - use findByIdAndUpdate with error handling
        const updatedTourist = await Tourist.findByIdAndUpdate(
            touristId, 
            {
                status: 'emergency',
                lastEmergencyAlert: new Date()
            },
            { new: true }
        )

        if (!updatedTourist) {
            // If tourist was deleted between checks, clean up the alert
            await Alert.findByIdAndDelete(alert._id)
            return res.status(404).json({
                success: false,
                message: 'Tourist not found during status update'
            })
        }

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
        const { name, coordinates, type, description, radius, riskLevel, alertMessage } = req.body

        if (!name || !coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Name and coordinates are required'
            })
        }

        // Validate coordinates
        if (!Array.isArray(coordinates)) {
            return res.status(400).json({
                success: false,
                message: 'Coordinates must be an array'
            })
        }

        // Validate geofence type
        const validTypes = ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'];
        if (type && !validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid geofence type. Must be one of: ${validTypes.join(', ')}`
            })
        }

        // Validate risk level
        if (riskLevel !== undefined && (riskLevel < 1 || riskLevel > 10)) {
            return res.status(400).json({
                success: false,
                message: 'Risk level must be between 1 and 10'
            })
        }

        // Create geofence with a default createdBy user (you might want to get this from auth)
        const geofence = new GeoFence({
            name: name.trim(),
            type: type || 'warning',
            description: description?.trim(),
            geometry: {
                type: radius ? 'Circle' : 'Polygon',
                coordinates: radius ? coordinates : [coordinates],
                radius: radius
            },
            riskLevel: riskLevel || 5,
            alertMessage: alertMessage || {
                english: `You are entering ${name}`,
                hindi: `आप ${name} में प्रवेश कर रहे हैं`
            },
            isActive: true,
            createdBy: req.user?.uid || 'system' // This should come from authentication
        })

        await geofence.save()

        res.status(201).json({
            success: true,
            message: 'Geofence created successfully',
            data: {
                id: geofence._id,
                name: geofence.name,
                type: geofence.type,
                geometry: geofence.geometry,
                riskLevel: geofence.riskLevel,
                isActive: geofence.isActive
            }
        })

    } catch (error) {
        console.error('Error creating geofence:', error)
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: Object.values(error.errors).map(err => err.message)
            })
        }
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A geofence with this name already exists'
            })
        }
        
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

/**
 * @swagger
 * /api/tracking/location/history/all/{touristId}:
 *   get:
 *     summary: Get complete location history for a specific tourist
 *     description: Retrieves all location history records for a specified tourist with optional filtering and pagination
 *     tags: [Tracking]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: touristId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tourist ID to get location history for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *           maximum: 10000
 *         description: Maximum number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip for pagination
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [gps, network, manual, iot_device, emergency]
 *         description: Filter by location source
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, geojson, csv]
 *           default: json
 *         description: Response format
 *     responses:
 *       200:
 *         description: Location history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         touristId:
 *                           type: string
 *                         touristName:
 *                           type: string
 *                         totalRecords:
 *                           type: integer
 *                         returnedRecords:
 *                           type: integer
 *                         timeRange:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                         locations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               latitude:
 *                                 type: number
 *                               longitude:
 *                                 type: number
 *                               accuracy:
 *                                 type: number
 *                               speed:
 *                                 type: number
 *                               heading:
 *                                 type: number
 *                               altitude:
 *                                 type: number
 *                               batteryLevel:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               source:
 *                                 type: string
 *                               networkInfo:
 *                                 type: object
 *                               context:
 *                                 type: object
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - can only access own data or authorized data
 *       404:
 *         description: Tourist not found
 *       500:
 *         description: Internal server error
 */
export const getUserLocationHistory = async (req, res) => {
    try {
        const { touristId } = req.params;
        const {
            startDate,
            endDate,
            limit = 1000,
            offset = 0,
            source,
            format = 'json'
        } = req.query;

        // Input validation
        const limitNum = Math.min(parseInt(limit) || 1000, 10000); // Max 10k records
        const offsetNum = Math.max(parseInt(offset) || 0, 0);

        // Validate tourist exists and user has access
        const tourist = await Tourist.findById(touristId);
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            });
        }

        // Authorization check: user can only access their own data OR admin access
        const isOwnData = req.user && req.user.uid === tourist.firebaseUid;
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'authority');
        
        if (!isOwnData && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own location history.'
            });
        }

        // Build time filter
        let timeFilter = { touristId };
        
        if (startDate || endDate) {
            timeFilter.timestamp = {};
            
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid startDate format. Use YYYY-MM-DD format.'
                    });
                }
                timeFilter.timestamp.$gte = start;
            }
            
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid endDate format. Use YYYY-MM-DD format.'
                    });
                }
                // Set to end of day
                end.setHours(23, 59, 59, 999);
                timeFilter.timestamp.$lte = end;
            }
        }

        // Add source filter if specified
        if (source && ['gps', 'network', 'manual', 'iot_device', 'emergency'].includes(source)) {
            timeFilter.source = source;
        }

        // Get total count for pagination info
        const totalRecords = await LocationHistory.countDocuments(timeFilter);

        // Fetch location records with pagination
        const locations = await LocationHistory.find(timeFilter)
            .sort({ timestamp: -1 })
            .skip(offsetNum)
            .limit(limitNum)
            .lean();

        // Format response based on requested format
        let responseData;
        
        switch (format) {
            case 'geojson':
                responseData = {
                    type: 'FeatureCollection',
                    features: locations.map(loc => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: loc.location.coordinates
                        },
                        properties: {
                            id: loc._id,
                            timestamp: loc.timestamp,
                            accuracy: loc.accuracy,
                            speed: loc.speed,
                            heading: loc.heading,
                            altitude: loc.altitude,
                            batteryLevel: loc.batteryLevel,
                            source: loc.source,
                            networkInfo: loc.networkInfo,
                            context: loc.context
                        }
                    })),
                    metadata: {
                        touristId: touristId,
                        touristName: tourist.personalInfo?.name || 'Unknown',
                        totalRecords,
                        returnedRecords: locations.length,
                        timeRange: {
                            startDate: timeFilter.timestamp?.$gte || null,
                            endDate: timeFilter.timestamp?.$lte || null
                        }
                    }
                };
                break;

            case 'csv':
                // For CSV format, return CSV data
                const csvHeader = 'id,latitude,longitude,accuracy,speed,heading,altitude,batteryLevel,timestamp,source\n';
                const csvData = locations.map(loc => 
                    `${loc._id},${loc.location.coordinates[1]},${loc.location.coordinates[0]},${loc.accuracy || ''},${loc.speed || ''},${loc.heading || ''},${loc.altitude || ''},${loc.batteryLevel || ''},${loc.timestamp},${loc.source}`
                ).join('\n');
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="location_history_${touristId}.csv"`);
                return res.send(csvHeader + csvData);

            default: // json
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
                    source: loc.source,
                    networkInfo: loc.networkInfo,
                    context: loc.context
                }));

                responseData = {
                    touristId: touristId,
                    touristName: tourist.personalInfo?.name || 'Unknown',
                    totalRecords,
                    returnedRecords: locations.length,
                    pagination: {
                        limit: limitNum,
                        offset: offsetNum,
                        hasMore: (offsetNum + locations.length) < totalRecords,
                        nextOffset: totalRecords > (offsetNum + limitNum) ? offsetNum + limitNum : null
                    },
                    timeRange: {
                        startDate: timeFilter.timestamp?.$gte || null,
                        endDate: timeFilter.timestamp?.$lte || null
                    },
                    filters: {
                        source: source || null
                    },
                    locations: formattedLocations
                };
                break;
        }

        res.status(200).json({
            success: true,
            message: 'Location history retrieved successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Error getting user location history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * @swagger
 * /api/tracking/location/history/my:
 *   get:
 *     summary: Get current user's complete location history
 *     description: Retrieves all location history for the authenticated user
 *     tags: [Tracking]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Maximum number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip for pagination
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, geojson, csv]
 *           default: json
 *         description: Response format
 *     responses:
 *       200:
 *         description: Location history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tourist profile not found
 */
export const getMyLocationHistory = async (req, res) => {
    try {
        if (!req.user || !req.user.uid) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Find tourist profile for authenticated user
        const tourist = await Tourist.findOne({ firebaseUid: req.user.uid });
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist profile not found. Please complete your profile setup.'
            });
        }

        // Use the existing getUserLocationHistory function by setting touristId in params
        req.params.touristId = tourist._id.toString();
        
        // Call the main function
        return await getUserLocationHistory(req, res);

    } catch (error) {
        console.error('Error getting my location history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};