import { auth } from '../config/firebase.config.js';

/**
 * Middleware to verify Firebase ID tokens for protected routes
 */
export const verifyFirebaseToken = async (req, res, next) => {
    try {
        // Check if Firebase is configured
        if (!auth) {
            return res.status(503).json({
                success: false,
                message: 'Firebase authentication is not configured. Please set up Firebase credentials.'
            });
        }

        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header is required. Format: Bearer <token>'
            });
        }

        // Check if header starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization header format. Expected: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1]; 
        
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            return res.status(401).json({
                success: false,
                message: 'Valid Firebase ID token is required'
            });
        }

        // Basic token format validation (JWT should have 3 parts)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Token must be a valid JWT.'
            });
        }

        // Verify the token with Firebase
        const decodedToken = await auth.verifyIdToken(token);
        
        // Add user data to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            firebaseUser: decodedToken
        };

        next();
    } catch (error) {
        // Only log error message, not full error object for security
        console.error('Firebase token verification error:', error.message);
        
        // Log full error details only in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Full error details:', error);
        }
        
        // Handle specific Firebase auth errors
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.',
                error: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Please provide a valid Firebase ID token.',
                error: 'INVALID_TOKEN_FORMAT'
            });
        }

        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                success: false,
                message: 'Token has been revoked. Please login again.',
                error: 'TOKEN_REVOKED'
            });
        }

        // Generic error for other auth failures
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.',
            error: 'AUTHENTICATION_FAILED'
        });
    }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req, res, next) => {
    try {
        // If Firebase is not configured, continue without auth
        if (!auth) {
            req.user = null;
            return next();
        }

        const authHeader = req.headers.authorization;
        
        // If no auth header, continue without authentication
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        // If no token or invalid token, continue without authentication
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            req.user = null;
            return next();
        }

        // Basic token format validation
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            req.user = null;
            return next();
        }

        // Try to verify the token
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            firebaseUser: decodedToken
        };

        next();
    } catch (error) {
        // If token verification fails, continue without authentication
        // This allows the route to handle whether auth is required or not
        req.user = null;
        next();
    }
};