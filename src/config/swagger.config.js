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
    apis: [],
};

const specs = swaggerJSDoc(options);
export default specs;