// src/controller/student.controller.js
import mongoose from "mongoose";
import feedback from "../model/feedback.js";
import programRegistration from "../model/programRegistration.js";
import TutorProfile from "../model/tutor.js";
import Session from "../model/session.js";
import Feedback from "../model/feedback.js";
import { createNotification } from "../services/notificationService.js";


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

    const tutorProfile = await TutorProfile.findById(tutorId);
    
    // Gửi thông báo cho Tutor
    if (tutorProfile && tutorProfile.accountId) {
      await createNotification({
        userId: tutorProfile.accountId, // ID tài khoản của Tutor
        title: "Yêu cầu đặt lịch mới",
        message: `Sinh viên vừa đặt lịch môn ${subject} vào lúc ${start.toLocaleString()}.`,
        type: "INFO",
        link: "/pending", // Link đến trang duyệt lịch của Tutor
        emailContent: `<p>Bạn có yêu cầu lịch học mới môn <b>${subject}</b>.</p><p>Thời gian: ${start.toLocaleString()}</p><p>Vui lòng vào hệ thống để xác nhận.</p>`
      });
    }
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
export async function getStudentSessions(req, res) {
  try {
    const studentId = req.user.sub;
    const { status } = req.query;

    let query = { studentId };
    
    // Filter by status
    if (status === "upcoming") {
      query.status = { $in: ["PENDING", "ACCEPTED"] };
      query.startTime = { $gt: new Date() };
    } else if (status === "completed") {
      query.status = "DONE";
    } else if (status === "pending") {
      query.status = "PENDING";
    }

    const sessions = await Session.find(query)
      .populate("tutorId", "fullName")
      .sort({ startTime: 1 })
      .lean();

    // Transform data for frontend
    const transformedSessions = sessions.map(session => ({
      _id: session._id,
      subject: session.subject,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      meetingLink: session.meetingLink,
      tutorName: session.tutorId?.fullName,
      hasFeedback: false // We'll check this next
    }));

    // Check which sessions have feedback
    const sessionIds = sessions.map(s => s._id);
    const existingFeedback = await Feedback.find({ 
      sessionId: { $in: sessionIds } 
    }).select('sessionId').lean();

    const feedbackSessionIds = new Set(existingFeedback.map(f => f.sessionId.toString()));
    
    transformedSessions.forEach(session => {
      session.hasFeedback = feedbackSessionIds.has(session._id.toString());
    });

    res.json({ success: true, sessions: transformedSessions });

  } catch (error) {
    console.error("Get student sessions error:", error);
    res.status(500).json({ message: "Failed to load sessions" });
  }
}

export async function cancelStudentSession(req, res) {
  try {
    const { sessionId } = req.params;
    const studentId = req.user.sub;

    const session = await Session.findOne({ _id: sessionId, studentId });
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "PENDING") {
      return res.status(400).json({ message: "Only pending sessions can be cancelled" });
    }

    // Check if session is at least 2 hours away
    const timeUntilSession = new Date(session.startTime) - new Date();
    if (timeUntilSession < 2 * 60 * 60 * 1000) {
      return res.status(400).json({ message: "Sessions can only be cancelled 2 hours before start time" });
    }

    session.status = "CANCELLED";
    await session.save();

    res.json({ success: true, message: "Session cancelled successfully" });

  } catch (error) {
    console.error("Cancel session error:", error);
    res.status(500).json({ message: "Failed to cancel session" });
  }
}

export async function getSessionHistory(req, res) {
  try {
    const studentId = req.user.sub;
    const { page = 1, limit = 10 } = req.query;

    const sessions = await Session.find({ 
      studentId, 
      status: "DONE" 
    })
      .populate("tutorId", "fullName subjectSpecialty")
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Session.countDocuments({ studentId, status: "DONE" });

    res.json({
      success: true,
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error("Get session history error:", error);
    res.status(500).json({ message: "Failed to load session history" });
  }
}