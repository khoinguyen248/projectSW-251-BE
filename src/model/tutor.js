import mongoose from "mongoose";

// src/model/tutor.js
const tutorProfileSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  fullName: String,
  subjectSpecialty: [String],
  experienceYears: Number,
  bio: String,
  hourlyRate: Number,
  availability: [String],
  
  // NEW FIELDS
  teachingStyle: {
    type: String,
    enum: ["structured", "interactive", "flexible", "practice"],
    default: "structured"
  },
  expertiseLevel: { type: Map, of: String }, // { "Math": "advanced", "Physics": "intermediate" }
  studentLevelPreference: [String],
  maxStudents: { type: Number, default: 5 },
  certification: [String],
  educationBackground: String,
  
}, { timestamps: true });

const TutorProfile = mongoose.model("tutorprofiles", tutorProfileSchema);
export default TutorProfile;
