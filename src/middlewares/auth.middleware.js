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
                message: 'Authorization header is required'
            });
        }

        const token = authHeader.split(' ')[1]; 
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token is required'
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
        console.error('Firebase token verification error:', error);
        
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }
        
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
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
        
        if (!authHeader) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
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