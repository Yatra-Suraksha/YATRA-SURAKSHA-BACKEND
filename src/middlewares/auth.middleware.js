import { auth } from '../config/firebase.config.js';

export const verifyFirebaseToken = async (req, res, next) => {
    try {
        
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
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Token must be a valid JWT.'
            });
        }
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
        
        console.error('Firebase token verification error:', error.message);
        
        
        if (process.env.NODE_ENV === 'development') {
            console.error('Full error details:', error);
        }
        
        
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
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.',
            error: 'AUTHENTICATION_FAILED'
        });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        
        if (!auth) {
            req.user = null;
            return next();
        }

        const authHeader = req.headers.authorization;
        
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            req.user = null;
            return next();
        }
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            req.user = null;
            return next();
        }
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
        
        
        req.user = null;
        next();
    }
};