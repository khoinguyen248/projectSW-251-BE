// src/routes/student.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import {
  listTutors,
  registerProgram,
  scheduleSession,
  joinSession,
  addFeedback,
  getStudentSessions,
  cancelStudentSession,
  getSessionHistory
} from "../controller/student.controller.js";

const studentRoutes = Router();

// SỬA LẠI CÁC ENDPOINTS - bỏ prefix /student
studentRoutes.get("/tutors", requireAuth, requireRole("STUDENT", "TUTOR"), listTutors);
studentRoutes.post("/program/register", requireAuth, requireRole("STUDENT"), registerProgram);
studentRoutes.post("/sessions", requireAuth, requireRole("STUDENT"), scheduleSession);
studentRoutes.get("/sessions/:id/join", requireAuth, requireRole("STUDENT", "TUTOR"), joinSession);
studentRoutes.post("/feedback", requireAuth, requireRole("STUDENT"), addFeedback);
studentRoutes.get("/sessions", requireAuth, requireRole("STUDENT"), getStudentSessions);
studentRoutes.patch("/sessions/:sessionId/cancel", requireAuth, requireRole("STUDENT"), cancelStudentSession);
studentRoutes.get("/sessions/history", requireAuth, requireRole("STUDENT"), getSessionHistory);
export default studentRoutes;