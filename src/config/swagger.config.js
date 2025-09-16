import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Yatra Suraksha API',
            version: '1.0.0',
            description: 'Authentication API for Yatra Suraksha Travel App',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                FirebaseAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Firebase ID Token'
                }
            },
            schemas: {
                
                User: {
                    type: 'object',
                    properties: {
                        uid: {
                            type: 'string',
                            description: 'Firebase user ID'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        name: {
                            type: 'string',
                            description: 'User display name'
                        },
                        picture: {
                            type: 'string',
                            format: 'uri',
                            description: 'User profile picture URL'
                        }
                    }
                },
                
                
                Tourist: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Unique tourist ID' },
                        digitalId: { type: 'string', description: 'Blockchain digital ID' },
                        firebaseUid: { type: 'string', description: 'Firebase authentication ID' },
                        personalInfo: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                email: { type: 'string', format: 'email' },
                                phone: { type: 'string' },
                                nationality: { type: 'string' },
                                dateOfBirth: { type: 'string', format: 'date' },
                                gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] }
                            }
                        },
                        currentLocation: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } },
                                timestamp: { type: 'string', format: 'date-time' },
                                accuracy: { type: 'number' },
                                address: { type: 'string' }
                            }
                        },
                        safetyScore: { type: 'number', minimum: 0, maximum: 100 },
                        status: { type: 'string', enum: ['active', 'inactive', 'emergency', 'missing', 'safe'] },
                        checkInTime: { type: 'string', format: 'date-time' },
                        expectedCheckOutTime: { type: 'string', format: 'date-time' }
                    }
                },
                
                
                LocationHistory: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        deviceId: { type: 'string' },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' },
                        accuracy: { type: 'number' },
                        speed: { type: 'number' },
                        altitude: { type: 'number' },
                        heading: { type: 'number' },
                        batteryLevel: { type: 'number', minimum: 0, maximum: 100 },
                        source: { type: 'string', enum: ['gps', 'network', 'manual', 'iot_device', 'emergency'] }
                    }
                },
                
                
                Alert: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        alertId: { type: 'string', description: 'Unique alert identifier' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        type: { type: 'string', enum: ['emergency', 'geofence_exit', 'geofence_enter', 'low_battery', 'device_offline', 'panic_button', 'anomaly_detected'] },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        message: { type: 'string' },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' },
                        acknowledgment: {
                            type: 'object',
                            properties: {
                                isAcknowledged: { type: 'boolean' },
                                acknowledgedBy: { type: 'string' },
                                acknowledgedAt: { type: 'string', format: 'date-time' },
                                response: { type: 'string' }
                            }
                        }
                    }
                },
                
                
                Device: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        deviceId: { type: 'string', description: 'Unique device identifier' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        type: { type: 'string', enum: ['mobile', 'smart_band', 'iot_tag', 'beacon'] },
                        manufacturer: { type: 'string' },
                        model: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'inactive', 'low_battery', 'offline', 'maintenance'] },
                        currentMetrics: {
                            type: 'object',
                            properties: {
                                batteryLevel: { type: 'number', minimum: 0, maximum: 100 },
                                signalStrength: { type: 'number' },
                                lastPing: { type: 'string', format: 'date-time' },
                                location: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', enum: ['Point'] },
                                        coordinates: { type: 'array', items: { type: 'number' } }
                                    }
                                }
                            }
                        }
                    }
                },
                
                
                GeoFence: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string', enum: ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'] },
                        geometry: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Polygon', 'Circle', 'Point'] },
                                coordinates: { type: 'array' },
                                radius: { type: 'number' }
                            }
                        },
                        riskLevel: { type: 'number', minimum: 1, maximum: 10 },
                        alertMessage: {
                            type: 'object',
                            properties: {
                                english: { type: 'string' },
                                hindi: { type: 'string' },
                                assamese: { type: 'string' },
                                bengali: { type: 'string' },
                                manipuri: { type: 'string' }
                            }
                        },
                        isActive: { type: 'boolean' },
                        createdBy: { type: 'string', description: 'Reference to User' }
                    }
                },
                
                
                Incident: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        incidentId: { type: 'string', description: 'Unique incident identifier' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        digitalId: { type: 'string', description: 'Reference to DigitalId' },
                        type: { type: 'string', enum: ['panic_button', 'anomaly_detected', 'missing_person', 'medical_emergency', 'geofence_violation', 'device_malfunction', 'weather_alert', 'manual_report'] },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        status: { type: 'string', enum: ['open', 'investigating', 'responding', 'resolved', 'closed', 'false_alarm'] },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } },
                                address: { type: 'string' },
                                landmark: { type: 'string' },
                                accuracy: { type: 'number' }
                            }
                        },
                        description: { type: 'string' },
                        response: {
                            type: 'object',
                            properties: {
                                evirNumber: { type: 'string', description: 'Electronic FIR number' },
                                assignedOfficer: { type: 'string', description: 'Reference to User' },
                                estimatedResponseTime: { type: 'number' },
                                actualResponseTime: { type: 'number' }
                            }
                        }
                    }
                },
                
                
                DigitalId: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        blockchainHash: { type: 'string', description: 'Blockchain transaction hash' },
                        qrCode: { type: 'string', description: 'QR code data' },
                        kycData: {
                            type: 'object',
                            properties: {
                                verified: { type: 'boolean' },
                                verificationDate: { type: 'string', format: 'date-time' },
                                verificationScore: { type: 'number', minimum: 0, maximum: 100 },
                                documents: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            type: { type: 'string', enum: ['aadhaar', 'passport', 'visa', 'driving_license', 'photo'] },
                                            documentNumber: { type: 'string' },
                                            verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
                                            verifiedBy: { type: 'string', description: 'Reference to User' },
                                            verificationDate: { type: 'string', format: 'date-time' },
                                            expiryDate: { type: 'string', format: 'date' }
                                        }
                                    }
                                }
                            }
                        },
                        isActive: { type: 'boolean' },
                        issuedDate: { type: 'string', format: 'date-time' },
                        expiryDate: { type: 'string', format: 'date-time' }
                    }
                },
                
                
                OCRResult: {
                    type: 'object',
                    properties: {
                        documentType: { type: 'string', enum: ['aadhaar', 'passport'] },
                        extractedInfo: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                dob: { type: 'string' },
                                address: { type: 'string' },
                                phone: { type: 'string' },
                                documentNumber: { type: 'string' }
                            }
                        },
                        confidence: { type: 'number', minimum: 0, maximum: 1 },
                        extractedText: { type: 'string' }
                    }
                },
                
                
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        },
                        error: {
                            type: 'string',
                            example: 'Detailed error information'
                        }
                    }
                },
                
                
                DataResponse: {
                    type: 'object',
                    allOf: [
                        { $ref: '#/components/schemas/SuccessResponse' },
                        {
                            type: 'object',
                            properties: {
                                data: {
                                    type: 'object',
                                    description: 'Response data object'
                                }
                            }
                        }
                    ]
                },
                
                
                LocationUpdateRequest: {
                    type: 'object',
                    required: ['touristId', 'latitude', 'longitude'],
                    properties: {
                        touristId: { 
                            type: 'string', 
                            description: 'Tourist ID' 
                        },
                        latitude: { 
                            type: 'number', 
                            minimum: -90, 
                            maximum: 90,
                            description: 'Latitude coordinate'
                        },
                        longitude: { 
                            type: 'number', 
                            minimum: -180, 
                            maximum: 180,
                            description: 'Longitude coordinate'
                        },
                        accuracy: { 
                            type: 'number', 
                            description: 'GPS accuracy in meters (optional)' 
                        },
                        speed: { 
                            type: 'number', 
                            description: 'Speed in m/s (optional)' 
                        },
                        heading: { 
                            type: 'number', 
                            description: 'Direction in degrees (optional)' 
                        },
                        altitude: { 
                            type: 'number', 
                            description: 'Altitude in meters (optional)' 
                        },
                        batteryLevel: { 
                            type: 'number', 
                            minimum: 0, 
                            maximum: 100,
                            description: 'Battery level percentage (optional)'
                        },
                        source: { 
                            type: 'string', 
                            enum: ['gps', 'network', 'manual', 'iot_device', 'emergency'],
                            description: 'Location source type (optional)'
                        }
                    },
                    example: {
                        touristId: "64f8a2b4c1d2e3f456789abc",
                        latitude: 26.1445,
                        longitude: 91.7362,
                        accuracy: 5.2,
                        speed: 2.5,
                        heading: 180,
                        altitude: 56,
                        batteryLevel: 85,
                        source: "gps"
                    }
                },
                
                
                GeofenceCreateRequest: {
                    type: 'object',
                    required: ['name', 'type', 'geometry'],
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string', enum: ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'] },
                        geometry: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Polygon', 'Circle', 'Point'] },
                                coordinates: { type: 'array' },
                                radius: { type: 'number' }
                            }
                        },
                        riskLevel: { type: 'number', minimum: 1, maximum: 10 },
                        alertMessage: {
                            type: 'object',
                            properties: {
                                english: { type: 'string' },
                                hindi: { type: 'string' },
                                assamese: { type: 'string' },
                                bengali: { type: 'string' },
                                manipuri: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        paths: {
            '/api/users/verify': {
                post: {
                    summary: 'Verify Firebase authentication token',
                    description: 'Verifies the provided Firebase ID token and returns user information',
                    tags: ['Authentication'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Token verified successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            user: {
                                                                allOf: [
                                                                    { $ref: '#/components/schemas/User' },
                                                                    {
                                                                        type: 'object',
                                                                        properties: {
                                                                            tokenValid: {
                                                                                type: 'boolean',
                                                                                example: true
                                                                            }
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Invalid or expired token',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        500: {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/users/me': {
                get: {
                    summary: 'Get current user information',
                    description: 'Retrieves current user information from Firebase token',
                    tags: ['User'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'User information retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            user: {
                                                                allOf: [
                                                                    { $ref: '#/components/schemas/User' },
                                                                    {
                                                                        type: 'object',
                                                                        properties: {
                                                                            source: {
                                                                                type: 'string',
                                                                                example: 'firebase_token'
                                                                            }
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Invalid or expired token',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        500: {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/users/profile': {
                get: {
                    summary: 'Get tourist profile',
                    description: 'Retrieve the current user\'s tourist profile information',
                    tags: ['User Management'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Tourist profile retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            profile: {
                                                                $ref: '#/components/schemas/User'
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Profile not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                put: {
                    summary: 'Update tourist profile',
                    description: 'Update the current user\'s tourist profile information',
                    tags: ['User Management'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        personalInfo: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                phone: { type: 'string' },
                                                dateOfBirth: { type: 'string', format: 'date' },
                                                nationality: { type: 'string' },
                                                address: { type: 'string' }
                                            }
                                        },
                                        emergencyContacts: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string' },
                                                    phone: { type: 'string' },
                                                    relationship: { type: 'string' }
                                                }
                                            }
                                        },
                                        preferences: {
                                            type: 'object',
                                            properties: {
                                                language: { type: 'string' },
                                                notifications: {
                                                    type: 'object',
                                                    properties: {
                                                        push: { type: 'boolean' },
                                                        sms: { type: 'boolean' },
                                                        email: { type: 'boolean' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Profile updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            profile: { $ref: '#/components/schemas/User' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/users/profile/status': {
                get: {
                    summary: 'Get profile completion status',
                    description: 'Check the completion status of the user\'s profile',
                    tags: ['User Management'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Profile status retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            completionPercentage: { type: 'number' },
                                                            missingFields: {
                                                                type: 'array',
                                                                items: { type: 'string' }
                                                            },
                                                            stage: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/ocr/process': {
                post: {
                    summary: 'Process document with OCR',
                    description: 'Upload an Aadhaar card or passport image to extract name, DOB, address, and phone number',
                    tags: ['OCR'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        document: {
                                            type: 'string',
                                            format: 'binary',
                                            description: 'Document image file (JPEG, PNG, WebP)'
                                        }
                                    },
                                    required: ['document']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Document processed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    documentType: { type: 'string', enum: ['aadhaar', 'passport'] },
                                                    extractedInfo: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string' },
                                                            dob: { type: 'string' },
                                                            address: { type: 'string' },
                                                            phone: { type: 'string' },
                                                            documentNumber: { type: 'string' }
                                                        }
                                                    },
                                                    confidence: { type: 'number' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/ocr/health': {
                get: {
                    summary: 'Check OCR service health',
                    description: 'Check if OCR service is running and configured properly',
                    tags: ['OCR'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'OCR service status',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            services: {
                                                type: 'object',
                                                properties: {
                                                    azure: { type: 'boolean' },
                                                    upload: { type: 'boolean' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/location/update/me': {
                post: {
                    summary: 'Update my location',
                    description: 'Update the current user\'s location coordinates',
                    tags: ['Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LocationUpdateRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Location updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            location: {
                                                                type: 'object',
                                                                properties: {
                                                                    latitude: { type: 'number' },
                                                                    longitude: { type: 'number' },
                                                                    timestamp: { type: 'string', format: 'date-time' },
                                                                    accuracy: { type: 'number' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/update': {
                post: {
                    summary: 'Update tourist location',
                    description: 'Update location for a specific tourist (admin function)',
                    tags: ['Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/LocationUpdateRequest' },
                                        {
                                            type: 'object',
                                            properties: {
                                                touristId: { type: 'string' }
                                            },
                                            required: ['touristId']
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Location updated successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/current/me': {
                get: {
                    summary: 'Get my current location',
                    description: 'Retrieve the current user\'s latest location',
                    tags: ['Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Current location retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            currentLocation: {
                                                                type: 'object',
                                                                properties: {
                                                                    latitude: { type: 'number' },
                                                                    longitude: { type: 'number' },
                                                                    timestamp: { type: 'string', format: 'date-time' },
                                                                    accuracy: { type: 'number' },
                                                                    address: { type: 'string' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Location not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/current/{touristId}': {
                get: {
                    summary: 'Get tourist current location',
                    description: 'Retrieve current location for a specific tourist',
                    tags: ['Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'touristId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist ID'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Tourist location retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            currentLocation: {
                                                                type: 'object',
                                                                properties: {
                                                                    latitude: { type: 'number' },
                                                                    longitude: { type: 'number' },
                                                                    timestamp: { type: 'string', format: 'date-time' },
                                                                    accuracy: { type: 'number' },
                                                                    address: { type: 'string' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/heatmap': {
                get: {
                    summary: 'Get location heatmap data',
                    description: 'Retrieve heatmap data for tourist locations',
                    tags: ['Location Tracking'],
                    parameters: [
                        {
                            name: 'bounds',
                            in: 'query',
                            schema: { type: 'string' },
                            description: 'Geographic bounds for heatmap (lat1,lng1,lat2,lng2)'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Heatmap data retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            heatmapData: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        intensity: { type: 'number' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/location/nearby': {
                get: {
                    summary: 'Get nearby tourists',
                    description: 'Find tourists near a specific location',
                    tags: ['Location Tracking'],
                    parameters: [
                        {
                            name: 'lat',
                            in: 'query',
                            required: true,
                            schema: { type: 'number' },
                            description: 'Latitude'
                        },
                        {
                            name: 'lng',
                            in: 'query',
                            required: true,
                            schema: { type: 'number' },
                            description: 'Longitude'
                        },
                        {
                            name: 'radius',
                            in: 'query',
                            schema: { type: 'number' },
                            description: 'Search radius in kilometers'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Nearby tourists retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            tourists: {
                                                                type: 'array',
                                                                items: { $ref: '#/components/schemas/User' }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/location/history/me': {
                get: {
                    summary: 'Get my location history',
                    description: 'Retrieve the current user\'s location history',
                    tags: ['Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'startDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'Start date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'End date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Maximum number of records to return'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Location history retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            history: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        timestamp: { type: 'string', format: 'date-time' },
                                                                        accuracy: { type: 'number' },
                                                                        address: { type: 'string' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/history/{touristId}': {
                get: {
                    summary: 'Get tourist location history',
                    description: 'Retrieve location history for a specific tourist',
                    tags: ['Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'touristId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist ID'
                        },
                        {
                            name: 'startDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'Start date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'End date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Maximum number of records to return'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Tourist location history retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            history: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        timestamp: { type: 'string', format: 'date-time' },
                                                                        accuracy: { type: 'number' },
                                                                        address: { type: 'string' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/stats': {
                get: {
                    summary: 'Get tourist statistics',
                    description: 'Retrieve statistics for the current tourist',
                    tags: ['Statistics'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Statistics retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            totalDistance: { type: 'number' },
                                                            placesVisited: { type: 'integer' },
                                                            activeDays: { type: 'integer' },
                                                            safetyScore: { type: 'number' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/devices/connected': {
                get: {
                    summary: 'Get connected devices',
                    description: 'Retrieve list of connected devices for the current tourist',
                    tags: ['Statistics'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Connected devices retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            devices: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        deviceId: { type: 'string' },
                                                                        deviceType: { type: 'string' },
                                                                        lastSeen: { type: 'string', format: 'date-time' },
                                                                        status: { type: 'string' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/active': {
                get: {
                    summary: 'Get active alerts',
                    description: 'Retrieve active alerts for the current tourist',
                    tags: ['Emergency Alerts'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Page number for pagination'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Number of alerts per page'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Active alerts retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alerts: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        _id: { type: 'string' },
                                                                        type: { type: 'string' },
                                                                        severity: { type: 'string' },
                                                                        message: { type: 'string' },
                                                                        location: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' }
                                                                            }
                                                                        },
                                                                        timestamp: { type: 'string', format: 'date-time' },
                                                                        acknowledged: { type: 'boolean' }
                                                                    }
                                                                }
                                                            },
                                                            pagination: {
                                                                type: 'object',
                                                                properties: {
                                                                    page: { type: 'integer' },
                                                                    limit: { type: 'integer' },
                                                                    total: { type: 'integer' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/acknowledge/{alertId}': {
                post: {
                    summary: 'Acknowledge alert',
                    description: 'Mark an alert as acknowledged',
                    tags: ['Emergency Alerts'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'alertId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Alert ID to acknowledge'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Alert acknowledged successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Alert not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/emergency/me': {
                post: {
                    summary: 'Create emergency alert (self)',
                    description: 'Create an emergency alert for the current user',
                    tags: ['Emergency Alerts'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        type: { type: 'string', enum: ['medical', 'security', 'accident', 'other'] },
                                        message: { type: 'string' },
                                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
                                    },
                                    required: ['latitude', 'longitude', 'type']
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Emergency alert created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alertId: { type: 'string' },
                                                            status: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/emergency': {
                post: {
                    summary: 'Create emergency alert for tourist',
                    description: 'Create an emergency alert for a specific tourist (admin function)',
                    tags: ['Emergency Alerts'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        touristId: { type: 'string' },
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        type: { type: 'string', enum: ['medical', 'security', 'accident', 'other'] },
                                        message: { type: 'string' },
                                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
                                    },
                                    required: ['touristId', 'latitude', 'longitude', 'type']
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Emergency alert created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alertId: { type: 'string' },
                                                            status: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/geofences': {
                get: {
                    summary: 'Get geofences',
                    description: 'Retrieve list of geofences with pagination',
                    tags: ['Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Page number for pagination'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Number of geofences per page'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Geofences retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            geofences: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        _id: { type: 'string' },
                                                                        name: { type: 'string' },
                                                                        type: { type: 'string' },
                                                                        center: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' }
                                                                            }
                                                                        },
                                                                        radius: { type: 'number' },
                                                                        active: { type: 'boolean' },
                                                                        createdAt: { type: 'string', format: 'date-time' }
                                                                    }
                                                                }
                                                            },
                                                            pagination: {
                                                                type: 'object',
                                                                properties: {
                                                                    page: { type: 'integer' },
                                                                    limit: { type: 'integer' },
                                                                    total: { type: 'integer' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                post: {
                    summary: 'Create geofence',
                    description: 'Create a new geofence',
                    tags: ['Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        type: { type: 'string', enum: ['safe_zone', 'danger_zone', 'restricted_area'] },
                                        center: {
                                            type: 'object',
                                            properties: {
                                                latitude: { type: 'number' },
                                                longitude: { type: 'number' }
                                            },
                                            required: ['latitude', 'longitude']
                                        },
                                        radius: { type: 'number' },
                                        description: { type: 'string' }
                                    },
                                    required: ['name', 'type', 'center', 'radius']
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Geofence created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            geofenceId: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/geofences/{fenceId}': {
                put: {
                    summary: 'Update geofence',
                    description: 'Update an existing geofence',
                    tags: ['Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'fenceId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Geofence ID to update'
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        type: { type: 'string', enum: ['safe_zone', 'danger_zone', 'restricted_area'] },
                                        center: {
                                            type: 'object',
                                            properties: {
                                                latitude: { type: 'number' },
                                                longitude: { type: 'number' }
                                            }
                                        },
                                        radius: { type: 'number' },
                                        description: { type: 'string' },
                                        active: { type: 'boolean' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Geofence updated successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Geofence not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                delete: {
                    summary: 'Delete geofence',
                    description: 'Delete an existing geofence',
                    tags: ['Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'fenceId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Geofence ID to delete'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Geofence deleted successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Geofence not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            }
        }
    },
    apis: ['./src/controllers/*.js', './src/routes/*.js'], 
};

const specs = swaggerJSDoc(options);
export default specs;