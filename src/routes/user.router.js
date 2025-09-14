import { Router } from "express";
import {
    verifyToken,
    getCurrentUser
} from "../controllers/user.controller.js";
import { verifyFirebaseToken } from "../utils/auth.middleware.js";

const router = Router();

// router.use(verifyFirebaseToken);


router.post("/verify", verifyToken);


router.get("/me", getCurrentUser);

export default router;

