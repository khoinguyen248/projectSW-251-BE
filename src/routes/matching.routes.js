// New file: src/routes/matching.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getSmartRecommendations, getMatchDetails } from "../controller/matching.controller.js";

const matchingRouter = Router();

matchingRouter.get("/recommendations", requireAuth, requireRole("STUDENT"), getSmartRecommendations);
matchingRouter.get("/match-details/:tutorId", requireAuth, requireRole("STUDENT"), getMatchDetails);

export default matchingRouter;