// src/controller/tutor.controller.js

import Session from "../model/session.js";
import TutorProfile from "../model/tutor.js";
import { createNotification } from "../services/notificationService.js";


// GET /tutor/sessions/pending

export async function listPending(req, res) {
  try {
    // Lấy _id của TutorProfile tương ứng với tài khoản đăng nhập
    const tutor = await TutorProfile.findOne(
      { accountId: req.user.sub },
      { _id: 1 }
    ).lean();

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Tìm các session có tutorId trùng với _id của TutorProfile
    const sessions = await Session.find({
      tutorId: tutor._id,
      status: "PENDING",
    }).lean();

    return res.json({ sessions });
  } catch (err) {
    console.error("Error in listPending:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


// PATCH /tutor/sessions/:id/confirm
export async function confirmSession(req, res) {
  try {
    const { id } = req.params;
    const { action, meetingLink } = req.body || {};
    
    console.log("🎯 confirmSession called:");
    console.log("- Session ID:", id);
    console.log("- Action:", action);
    console.log("- User ID (account):", req.user.sub);

    const session = await Session.findById(id);
    if (!session) {
      console.log(" Session not found:", id);
      return res.status(404).json({ message: "Session not found" });
    }

    console.log("🔍 Session found:", {
      id: session._id,
      tutorId: session.tutorId,
      status: session.status
    });

    const tutorProfile = await TutorProfile.findOne(
      { accountId: req.user.sub },
      { _id: 1 }
    ).lean();

    if (!tutorProfile) {
      console.log("Tutor profile not found");
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    console.log("Tutor profile ID:", tutorProfile._id);

    if (String(session.tutorId) !== String(tutorProfile._id)) {
      console.log("Forbidden: Session tutorId doesn't match user's tutor profile");
      console.log("- Session tutorId:", session.tutorId);
      console.log("- User's tutorProfileId:", tutorProfile._id);
      return res.status(403).json({ message: "Forbidden - Not your session" });
    }

    if (session.status !== "PENDING") {
      console.log("Session already handled:", session.status);
      return res.status(409).json({ message: "Session already handled" });
    }

    // Xử lý action
    if (action === "ACCEPT") {
      session.status = "ACCEPTED";
      if (meetingLink) {
        session.meetingLink = meetingLink;
        console.log("Meeting link added:", meetingLink);
      }
      console.log("Session accepted");
    } else if (action === "REJECT") {
      session.status = "REJECTED";
      console.log("Session rejected");
    } else {
      console.log("Invalid action:", action);
      return res.status(400).json({ message: "Invalid action" });
    }

    await session.save();

    console.log("💾 Session saved with new status:", session.status);
    const title = action === "ACCEPT" ? "Lịch học được chấp nhận" : "Lịch học bị từ chối";
    const type = action === "ACCEPT" ? "SUCCESS" : "ERROR";
    const msg = `Tutor đã ${action === "ACCEPT" ? "đồng ý" : "từ chối"} lịch học môn ${session.subject}.`;
    
    await createNotification({
        userId: session.studentId, // ID tài khoản của Student
        title: title,
        message: msg,
        type: type,
        link: "/student-dashboard",
        emailContent: `<p>${msg}</p><p>Thời gian: ${new Date(session.startTime).toLocaleString()}</p>`
    });

    return res.json({ 
      message: "Session updated successfully", 
      status: session.status 
    });
    
  } catch (error) {
    console.error("❌ Error in confirmSession:", error);
    return res.status(500).json({ message: "Server error" });
  }
}