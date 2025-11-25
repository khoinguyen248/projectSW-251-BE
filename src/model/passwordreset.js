import mongoose from "mongoose";
const passwordResetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Account", 
    required: true,
    index: true
  },
  token: { 
    type: String, 
    required: true,
    index: true,
    unique: true
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: true
  },
  used: {
    type: Boolean,
    default: false,
    index: true
  }
}, { 
  timestamps: true 
});

// Indexes
export const PasswordReset = mongoose.models.PasswordReset || 
  mongoose.model("PasswordReset", passwordResetSchema);