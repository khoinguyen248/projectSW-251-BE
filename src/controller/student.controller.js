// src/controller/student.controller.js
import mongoose from "mongoose";
import feedback from "../model/feedback.js";
import programRegistration from "../model/programRegistration.js";
import TutorProfile from "../model/tutor.js";
import Session from "../model/session.js";


// GET /tutors
export async function listTutors(req, res) {
  const tutors = await TutorProfile.find({})
    .select("accountId fullName subjectSpecialty ratingAvg totalRatings hourlyRate bio")
    .lean();
  return res.json({ tutors });
}

// POST /program/register
export async function registerProgram(req, res) {
  const { programName, notes } = req.body || {};
  if (!programName) return res.status(400).json({ message: "programName is required" });

  await programRegistration.create({
    studentId: req.user.sub,
    programName,
    notes: notes || "",
  });
  return res.status(201).json({ message: "Registered" });
}

// POST /sessions
export async function scheduleSession(req, res) {
  try {
    console.log("🎯 scheduleSession called!");
    console.log("📦 Request body:", req.body);
    console.log("👤 User ID:", req.user.sub);
    console.log("👤 User role:", req.user.role);

    const { tutorId, subject, startTime, endTime } = req.body || {};
    
    console.log("🔍 Parsed fields:", {
      tutorId,
      subject, 
      startTime,
      endTime
    });

    // Validate input
    if (!tutorId || !subject || !startTime || !endTime) {
      console.log("❌ Missing fields:", {
        tutorId: !tutorId,
        subject: !subject, 
        startTime: !startTime,
        endTime: !endTime
      });
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["tutorId", "subject", "startTime", "endTime"],
        received: req.body
      });
    }

    // Validate tutorId format
    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      console.log("❌ Invalid tutorId format:", tutorId);
      return res.status(400).json({ 
        message: "Invalid tutor ID format",
        tutorId 
      });
    }

    // Check if tutor exists
    const tutorExists = await TutorProfile.findById(tutorId);
    if (!tutorExists) {
      console.log("❌ Tutor not found:", tutorId);
      return res.status(404).json({ 
        message: "Tutor not found",
        tutorId 
      });
    }
    console.log("✅ Tutor found:", tutorExists.fullName);

    // Parse and validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    console.log("📅 Date parsing:", {
      startTime,
      endTime,
      startParsed: start,
      endParsed: end,
      startValid: !isNaN(start.getTime()),
      endValid: !isNaN(end.getTime())
    });

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        message: "Invalid date format",
        startTime,
        endTime 
      });
    }

    if (!(start < end)) {
      return res.status(400).json({ 
        message: "End time must be after start time",
        startTime: start.toISOString(),
        endTime: end.toISOString() 
      });
    }

    // Check for time conflicts (optional)
    const existingSession = await Session.findOne({
      tutorId,
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } }
      ],
      status: { $in: ["PENDING", "ACCEPTED"] }
    });

    if (existingSession) {
      console.log("❌ Time conflict found:", existingSession);
      return res.status(409).json({ 
        message: "Time conflict with existing session",
        conflictWith: existingSession._id 
      });
    }

    console.log(" Creating session...");
    const session = await Session.create({
      studentId: req.user.sub,
      tutorId,
      subject,
      startTime: start,
      endTime: end,
      status: "PENDING",
    });

    console.log(" Session created successfully:", session._id);
    
    return res.status(201).json({ 
      sessionId: session._id,
      message: "Session scheduled successfully"
    });

  } catch (error) {
    console.error(" Schedule session error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
}

// GET /sessions/:id/join
export async function joinSession(req, res) {
  const { id } = req.params;
  const s = await Session.findById(id).lean();
  if (!s) return res.status(404).json({ message: "Session not found" });

  // chỉ cho student chủ sở hữu hoặc tutor tham gia
  const uid = String(req.user.sub);
  if (uid !== String(s.studentId) && uid !== String(s.tutorId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (s.status !== "ACCEPTED" && s.status !== "DONE") {
    return res.status(409).json({ message: "Session not accepted yet" });
  }
  // meetingLink có thể tạo khi ACCEPTED
  return res.json({ meetingLink: s.meetingLink || "", session: s });
}

// POST /feedback
export async function addFeedback(req, res) {
  const { sessionId, rating, comment } = req.body || {};
  if (!sessionId || !rating) return res.status(400).json({ message: "Missing fields" });

  const s = await Session.findById(sessionId);
  if (!s) return res.status(404).json({ message: "Session not found" });
  if (String(s.studentId) !== String(req.user.sub)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (s.status !== "DONE" && s.endTime > new Date()) {
    return res.status(409).json({ message: "Session not finished yet" });
  }

  await feedback.create({
    sessionId,
    studentId: s.studentId,
    tutorId: s.tutorId,
    rating,
    comment: comment || "",
  });
  return res.status(201).json({ message: "Feedback submitted" });
}
