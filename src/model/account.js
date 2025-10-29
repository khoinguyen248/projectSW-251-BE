import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
    isVerified: {  
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["TUTOR", "STUDENT"],
    required: true,
  },
}, { timestamps: true });

const Account = mongoose.model("Account", accountSchema);
export default Account;
