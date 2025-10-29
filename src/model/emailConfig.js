import mongoose from "mongoose";

const emailConfigSchema = new mongoose.Schema({
  service: { 
    type: String, 
    enum: ['gmail', 'outlook', 'resend', 'sendgrid'], 
    default: 'gmail',
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  appPassword: { 
    type: String, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  dailyLimit: { 
    type: Number, 
    default: 100 
  },
  usedToday: { 
    type: Number, 
    default: 0 
  },
  lastReset: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Reset counter hàng ngày
emailConfigSchema.methods.checkAndResetDailyLimit = function() {
  const today = new Date();
  if (this.lastReset.toDateString() !== today.toDateString()) {
    this.usedToday = 0;
    this.lastReset = today;
    return this.save();
  }
  return Promise.resolve(this);
};

export default mongoose.model("EmailConfig", emailConfigSchema);