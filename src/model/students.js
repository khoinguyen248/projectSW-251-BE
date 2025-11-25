import mongoose from "mongoose";

// Update src/model/students.js - Add matching fields
// src/model/students.js
const studentProfileSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  fullName: String,
  grade: String,
  schoolName: String,
  
  // NEW FIELDS
  learningGoals: [String],
  preferredSubjects: [String],
  studentAvailability: [String],
  learningStyle: {
    type: String,
    enum: ["visual", "auditory", "kinesthetic", "mixed"],
    default: "mixed"
  },
  academicLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "intermediate"
  },
  preferredPriceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 500000 }
  },
  goals: String,
  
  enrolledTutors: [{ type: mongoose.Schema.Types.ObjectId, ref: "TutorProfile" }],
  progress: {
    math: Number,
    physics: Number,
    chemistry: Number,
  },
}, { timestamps: true });
const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;
