// Role-based authorization middleware
export const requireAdminRole = async (req, res, next) => {
    try {
        // Check if user has admin or authority role
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // For now, check if user email contains admin domains
        // TODO: Implement proper role system in database
        const adminDomains = ['@admin.yatrasuraksha.com', '@authority.gov.in'];
        const testEmails = ['test@gmail.com']; // Allow test users during development
        const isAdmin = adminDomains.some(domain => user.email?.includes(domain)) ||
                       user.email === process.env.ADMIN_EMAIL ||
                       (process.env.NODE_ENV === 'development' && testEmails.includes(user.email));

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for geofence operations. Current user: ' + user.email
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating admin role',
            error: error.message
        });
    }
};

// Enhanced geofence validation
export const validateGeofenceData = (req, res, next) => {
    const { name, coordinates, type, radius, riskLevel } = req.body;

    // Validate name
    if (name && (typeof name !== 'string' || name.trim().length < 3)) {
        return res.status(400).json({
            success: false,
            message: 'Name must be at least 3 characters long'
        });
    }

    // Validate coordinates
    if (coordinates) {
        // Handle object format: { latitude: x, longitude: y }
        if (coordinates.latitude !== undefined && coordinates.longitude !== undefined) {
            if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude must be numbers'
                });
            }
            // Validate coordinate ranges
            if (coordinates.longitude < -180 || coordinates.longitude > 180 || 
                coordinates.latitude < -90 || coordinates.latitude > 90) {
                return res.status(400).json({
                    success: false,
                    message: 'Coordinates out of valid range'
                });
            }
        }
        // Handle array format
        else if (Array.isArray(coordinates)) {
            // For polygon, validate coordinate structure
            if (Array.isArray(coordinates[0])) {
                for (const coord of coordinates) {
                    if (!Array.isArray(coord) || coord.length !== 2 || 
                        typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid coordinate format. Expected [longitude, latitude]'
                        });
                    }
                    // Validate longitude/latitude ranges
                    if (coord[0] < -180 || coord[0] > 180 || coord[1] < -90 || coord[1] > 90) {
                        return res.status(400).json({
                            success: false,
                            message: 'Coordinates out of valid range'
                        });
                    }
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Coordinates must be an array or object with latitude/longitude'
            });
        }
    }

    // Validate radius
    if (radius !== undefined) {
        if (typeof radius !== 'number' || radius <= 0 || radius > 50000) {
            return res.status(400).json({
                success: false,
                message: 'Radius must be between 1 and 50000 meters'
            });
        }
    }

    // Validate risk level
    if (riskLevel !== undefined) {
        if (!Number.isInteger(riskLevel) || riskLevel < 1 || riskLevel > 10) {
            return res.status(400).json({
                success: false,
                message: 'Risk level must be an integer between 1 and 10'
            });
        }
    }

    // Validate type
    const validTypes = ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'];
    if (type && !validTypes.includes(type)) {
        return res.status(400).json({
            success: false,
            message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
    }

    next();
};