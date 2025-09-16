import Tourist from '../models/tourist.model.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to create automatic tourist profile from Firebase auth data
 * Production-grade implementation with proper validation and staged completion
 */
const createAutomaticTouristProfile = async (firebaseUser) => {
    try {
        const { uid, email, name, picture, emailVerified } = firebaseUser;
        
        // Check if tourist profile already exists
        const existingTourist = await Tourist.findOne({ firebaseUid: uid });
        if (existingTourist) {
            return existingTourist;
        }

        // Generate unique digital ID with proper format
        const timestamp = Date.now();
        const uidPrefix = uid.substring(0, 8).toUpperCase();
        const digitalId = `YATRA-${timestamp}-${uidPrefix}`;
        
        // Calculate default checkout time (30 days for tourism visa)
        const defaultStayDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        const expectedCheckOut = new Date(Date.now() + defaultStayDuration);
        
        // Create tourist profile with production-ready defaults
        const touristProfile = new Tourist({
            digitalId,
            firebaseUid: uid,
            personalInfo: {
                name: name || 'User',
                email: email,
                // Phone and nationality are optional initially due to conditional validation
                profilePicture: picture || null
            },
            currentLocation: {
                type: 'Point',
                coordinates: [77.2090, 28.6139], // Default to New Delhi, India
                timestamp: new Date(),
                accuracy: null,
                address: 'Location not set - please update'
            },
            safetyScore: 75, // Neutral starting score
            status: 'active',
            profileCompletionStage: 'initial', // This allows optional phone/nationality
            checkInTime: new Date(),
            expectedCheckOutTime: expectedCheckOut,
            emergencyContacts: [], // To be filled by user
            travelItinerary: [], // To be filled by user
            preferences: {
                language: 'english',
                notifications: {
                    push: true,
                    sms: false, // Can't enable without phone number
                    email: emailVerified || false
                },
                trackingEnabled: true,
                shareLocationWithFamily: false
            },
            devices: [], // Will be populated when device connects
            kycStatus: 'pending',
            riskProfile: {
                travelExperience: 'beginner', // Conservative default
                medicalConditions: [],
                specialNeeds: [],
                previousIncidents: 0
            }
        });

        await touristProfile.save();
        
        console.log(`✅ Auto-created tourist profile for user: ${uid} with Digital ID: ${digitalId}`);
        return touristProfile;
        
    } catch (error) {
        console.error('❌ Error creating automatic tourist profile:', error);
        throw error;
    }
};

/**
 * @swagger
 * /api/users/verify:
 *   post:
 *     summary: Verify Firebase authentication token
 *     description: Verifies the provided Firebase ID token and returns user information extracted from the token
 *     tags: [Authentication]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Token verified successfully
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
 *                         user:
 *                           allOf:
 *                             - $ref: '#/components/schemas/User'
 *                             - type: object
 *                               properties:
 *                                 tokenValid:
 *                                   type: boolean
 *                                   example: true
 *                                 emailVerified:
 *                                   type: boolean
 *                                   example: true
 *             example:
 *               success: true
 *               message: "Token verified successfully"
 *               data:
 *                 user:
 *                   uid: "firebase_user_123"
 *                   email: "john.doe@example.com"
 *                   name: "John Doe"
 *                   picture: "https://example.com/profile.jpg"
 *                   emailVerified: true
 *                   tokenValid: true
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_user_data:
 *                 summary: No user data found
 *                 value:
 *                   success: false
 *                   message: "No user data found. Token may be invalid or missing."
 *                   error: "UNAUTHORIZED"
 *               invalid_token:
 *                 summary: Invalid token
 *                 value:
 *                   success: false
 *                   message: "Invalid or expired Firebase token"
 *                   error: "TOKEN_INVALID"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const verifyToken = async (req, res) => {
    try {
        // Check if user data exists (from optionalAuth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No valid token provided or token verification failed.',
                error: 'UNAUTHORIZED'
            });
        }

        const { uid, email, name, picture, emailVerified } = req.user;

        // Validate required fields
        if (!uid || !email) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token data. Missing required user information.',
                error: 'INVALID_TOKEN_DATA'
            });
        }

        // Automatically create tourist profile if it doesn't exist
        let touristProfile = null;
        try {
            touristProfile = await createAutomaticTouristProfile(req.user);
        } catch (touristError) {
            console.error('Error creating tourist profile:', touristError);
            // Continue without tourist profile - won't block authentication
        }

        res.status(200).json({
            success: true,
            message: 'Token verified successfully',
            data: {
                user: {
                    uid,
                    email,
                    name: name || 'Unknown User',
                    picture: picture || null,
                    emailVerified: emailVerified || false,
                    tokenValid: true,
                    touristProfile: touristProfile ? {
                        id: touristProfile._id,
                        digitalId: touristProfile.digitalId,
                        status: touristProfile.status,
                        stage: touristProfile.profileCompletionStage,
                        safetyScore: touristProfile.safetyScore,
                        kycStatus: touristProfile.kycStatus,
                        hasPhone: !!(touristProfile.personalInfo.phone),
                        hasNationality: !!(touristProfile.personalInfo.nationality),
                        hasEmergencyContact: touristProfile.emergencyContacts.length > 0,
                        profileComplete: touristProfile.profileCompletionStage === 'complete',
                        readyForTracking: touristProfile.profileCompletionStage !== 'initial'
                    } : null
                }
            }
        });
    } catch (error) {
        console.error('Error in verifyToken:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during token verification',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};


/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieves current user information from the Firebase authentication token
 *     tags: [User]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                         user:
 *                           allOf:
 *                             - $ref: '#/components/schemas/User'
 *                             - type: object
 *                               properties:
 *                                 source:
 *                                   type: string
 *                                   example: "firebase_token"
 *                                   description: "Source of user data"
 *                                 emailVerified:
 *                                   type: boolean
 *                                   example: true
 *             example:
 *               success: true
 *               message: "User information retrieved successfully"
 *               data:
 *                 user:
 *                   uid: "firebase_user_123"
 *                   email: "john.doe@example.com"
 *                   name: "John Doe"
 *                   picture: "https://example.com/profile.jpg"
 *                   emailVerified: true
 *                   source: "firebase_token"
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_user_data:
 *                 summary: No user data found
 *                 value:
 *                   success: false
 *                   message: "No user data found. Token may be invalid or missing."
 *                   error: "UNAUTHORIZED"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getCurrentUser = async (req, res) => {
    try {
        // Check if user data exists (from middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No user data found. Please authenticate first.',
                error: 'UNAUTHORIZED'
            });
        }

        const { uid, email, name, picture, emailVerified } = req.user;

        // Get or create tourist profile
        let touristProfile = null;
        try {
            touristProfile = await createAutomaticTouristProfile(req.user);
        } catch (touristError) {
            console.error('Error fetching/creating tourist profile:', touristError);
        }

        res.status(200).json({
            success: true,
            message: 'User info retrieved from token',
            data: {
                user: {
                    uid,
                    email,
                    name,
                    picture,
                    emailVerified,
                    source: 'firebase_token',
                    touristProfile: touristProfile ? {
                        id: touristProfile._id,
                        digitalId: touristProfile.digitalId,
                        status: touristProfile.status,
                        stage: touristProfile.profileCompletionStage,
                        safetyScore: touristProfile.safetyScore,
                        kycStatus: touristProfile.kycStatus,
                        checkInTime: touristProfile.checkInTime,
                        expectedCheckOutTime: touristProfile.expectedCheckOutTime,
                        hasPhone: !!(touristProfile.personalInfo.phone),
                        hasNationality: !!(touristProfile.personalInfo.nationality),
                        profileComplete: touristProfile.profileCompletionStage === 'complete',
                        locationTracking: touristProfile.preferences.trackingEnabled,
                        emergencyContactsCount: touristProfile.emergencyContacts.length,
                        itineraryCount: touristProfile.travelItinerary.length
                    } : null
                }
            }
        });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get complete tourist profile
 *     description: Retrieves the complete tourist profile for the authenticated user
 *     tags: [User Profile]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Tourist profile retrieved successfully
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
 *                         profile:
 *                           $ref: '#/components/schemas/Tourist'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tourist profile not found
 */
export const getTouristProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED'
            });
        }

        // Get or create tourist profile
        const touristProfile = await createAutomaticTouristProfile(req.user);

        if (!touristProfile) {
            return res.status(404).json({
                success: false,
                message: 'Tourist profile not found',
                error: 'PROFILE_NOT_FOUND'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tourist profile retrieved successfully',
            data: {
                profile: touristProfile
            }
        });
    } catch (error) {
        console.error('Error getting tourist profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tourist profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update tourist profile
 *     description: Updates the tourist profile information for the authenticated user
 *     tags: [User Profile]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personalInfo:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                   nationality:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                   gender:
 *                     type: string
 *                     enum: [male, female, other, prefer_not_to_say]
 *               emergencyContacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     relationship:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *               preferences:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                   trackingEnabled:
 *                     type: boolean
 *                   shareLocationWithFamily:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
export const updateTouristProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED'
            });
        }

        // Get or create tourist profile first
        let touristProfile = await createAutomaticTouristProfile(req.user);

        const allowedUpdates = ['personalInfo', 'emergencyContacts', 'preferences', 'travelItinerary', 'riskProfile'];
        const updates = {};

        // Filter and validate updates
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        // Special handling for nested personalInfo updates
        if (req.body.personalInfo) {
            updates.personalInfo = {
                ...touristProfile.personalInfo.toObject(),
                ...req.body.personalInfo,
                name: touristProfile.personalInfo.name, // Don't allow name change
                email: touristProfile.personalInfo.email // Don't allow email change
            };
        }

        // Auto-upgrade profile completion stage based on provided data
        const hasPhone = updates.personalInfo?.phone || touristProfile.personalInfo.phone;
        const hasNationality = updates.personalInfo?.nationality || touristProfile.personalInfo.nationality;
        const hasEmergencyContact = (updates.emergencyContacts && updates.emergencyContacts.length > 0) || 
                                   touristProfile.emergencyContacts.length > 0;
        
        // Calculate appropriate stage
        let newStage = touristProfile.profileCompletionStage;
        if (hasPhone && hasNationality && hasEmergencyContact) {
            newStage = 'complete';
        } else if (hasPhone && hasNationality) {
            newStage = 'basic';
        } else if (hasPhone || hasNationality) {
            newStage = 'basic';
        }
        
        // Only upgrade, never downgrade automatically
        const stageOrder = ['initial', 'basic', 'complete', 'verified'];
        const currentIndex = stageOrder.indexOf(touristProfile.profileCompletionStage);
        const newIndex = stageOrder.indexOf(newStage);
        
        if (newIndex > currentIndex) {
            updates.profileCompletionStage = newStage;
        }

        // Update the profile
        const updatedProfile = await Tourist.findByIdAndUpdate(
            touristProfile._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Tourist profile updated successfully',
            data: {
                profile: updatedProfile,
                updatedFields: Object.keys(updates)
            }
        });
    } catch (error) {
        console.error('Error updating tourist profile:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update tourist profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * @swagger
 * /api/users/profile/status:
 *   get:
 *     summary: Get profile completion status
 *     description: Returns information about profile completion and missing required fields
 *     tags: [User Profile]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Profile status retrieved successfully
 */
export const getProfileStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED'
            });
        }

        const touristProfile = await createAutomaticTouristProfile(req.user);
        
        // Define what constitutes a complete profile for production use
        const profileChecks = {
            'personalInfo.phone': {
                isComplete: !!(touristProfile.personalInfo.phone && 
                              touristProfile.personalInfo.phone.length >= 10),
                priority: 'high',
                description: 'Valid phone number for emergency contact'
            },
            'personalInfo.nationality': {
                isComplete: !!(touristProfile.personalInfo.nationality && 
                              touristProfile.personalInfo.nationality.length >= 2),
                priority: 'high', 
                description: 'Nationality for consular assistance'
            },
            'personalInfo.dateOfBirth': {
                isComplete: !!touristProfile.personalInfo.dateOfBirth,
                priority: 'medium',
                description: 'Date of birth for age-appropriate safety recommendations'
            },
            'emergencyContacts': {
                isComplete: touristProfile.emergencyContacts.length > 0,
                priority: 'critical',
                description: 'At least one emergency contact'
            },
            'currentLocation': {
                isComplete: touristProfile.currentLocation.coordinates[0] !== 77.2090 || 
                           touristProfile.currentLocation.coordinates[1] !== 28.6139,
                priority: 'medium',
                description: 'Current location for safety monitoring'
            }
        };

        const missingFields = Object.entries(profileChecks)
            .filter(([_, check]) => !check.isComplete)
            .map(([field, check]) => ({
                field,
                priority: check.priority,
                description: check.description
            }));

        const completedFields = Object.values(profileChecks).filter(check => check.isComplete).length;
        const totalFields = Object.keys(profileChecks).length;
        const completionPercentage = Math.round((completedFields / totalFields) * 100);

        // Determine profile stage based on completion
        let recommendedStage = 'initial';
        if (completionPercentage >= 80) {
            recommendedStage = 'complete';
        } else if (completionPercentage >= 50) {
            recommendedStage = 'basic';
        }

        // Check if profile stage should be updated
        const stageUpgradeNeeded = touristProfile.profileCompletionStage === 'initial' && recommendedStage !== 'initial';

        res.status(200).json({
            success: true,
            message: 'Profile status retrieved successfully',
            data: {
                profileId: touristProfile._id,
                digitalId: touristProfile.digitalId,
                currentStage: touristProfile.profileCompletionStage,
                recommendedStage,
                stageUpgradeAvailable: stageUpgradeNeeded,
                completionPercentage,
                isComplete: missingFields.length === 0,
                profileChecks,
                missingFields,
                priorityActions: missingFields
                    .filter(field => field.priority === 'critical')
                    .map(field => field.description),
                recommendations: {
                    immediate: missingFields.filter(f => f.priority === 'critical'),
                    important: missingFields.filter(f => f.priority === 'high'),
                    optional: missingFields.filter(f => f.priority === 'medium')
                },
                kycStatus: touristProfile.kycStatus,
                safetyScore: touristProfile.safetyScore,
                accountStatus: {
                    canUseTracking: completionPercentage >= 25,
                    canReceiveAlerts: touristProfile.emergencyContacts.length > 0,
                    canShareLocation: touristProfile.personalInfo.phone !== undefined,
                    requiresImmediateAction: missingFields.some(f => f.priority === 'critical')
                }
            }
        });
    } catch (error) {
        console.error('Error getting profile status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

