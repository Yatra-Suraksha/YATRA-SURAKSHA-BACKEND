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
router.use(sanitizeInput);
router.post("/verify", optionalAuth, verifyToken);
router.get("/me", verifyFirebaseToken, getCurrentUser);
router.get("/profile", verifyFirebaseToken, getTouristProfile);
router.put("/profile", verifyFirebaseToken, updateTouristProfile);
router.get("/profile/status", verifyFirebaseToken, getProfileStatus);

export default router;

