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
                // User and Authentication Schemas
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
                
                // Tourist Schema
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
                
                // Location History Schema
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
                
                // Alert Schema
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
                
                // Device Schema
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
                
                // GeoFence Schema
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
                
                // Incident Schema
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
                
                // Digital ID Schema
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
                
                // OCR Schema
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
                
                // Response Schemas
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
                
                // Data Response Schema
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
                
                // Location Update Request
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
                
                // Geofence Create Request
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
            }
        }
    },
    apis: ['./src/controllers/*.js', './src/routes/*.js'], // Scan controller and route files for JSDoc comments
};

const specs = swaggerJSDoc(options);
export default specs;