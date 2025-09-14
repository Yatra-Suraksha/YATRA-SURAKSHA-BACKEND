import swaggerJsdoc from 'swagger-jsdoc';

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
            }
        }
    },
    apis: [], // No need to scan files since we're defining everything here
};

const specs = swaggerJSDoc(options);
export default specs;