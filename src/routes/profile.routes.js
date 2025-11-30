import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { updateProfile, getProfile } from "../controller/profile.controller.js";
import { updateProfileValidation } from "../middleware/validation.js";

const profileRouter = Router();

profileRouter.get("/profile", requireAuth, getProfile);
profileRouter.put("/profile", requireAuth, updateProfileValidation, updateProfile);

export default profileRouter;