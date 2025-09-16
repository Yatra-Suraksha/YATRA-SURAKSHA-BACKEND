import { Router } from "express";
import {
    verifyToken,
    getCurrentUser,
    getTouristProfile,
    updateTouristProfile,
    getProfileStatus
} from "../controllers/user.controller.js";
import { verifyFirebaseToken, optionalAuth } from "../middlewares/auth.middleware.js";
import { sanitizeInput } from "../middlewares/validation.middleware.js";

const router = Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Token verification endpoint - uses optionalAuth to handle invalid tokens gracefully
router.post("/verify", optionalAuth, verifyToken);

// User info endpoint - requires valid authentication
router.get("/me", verifyFirebaseToken, getCurrentUser);

// Tourist profile management - requires authentication
router.get("/profile", verifyFirebaseToken, getTouristProfile);
router.put("/profile", verifyFirebaseToken, updateTouristProfile);
router.get("/profile/status", verifyFirebaseToken, getProfileStatus);

export default router;

