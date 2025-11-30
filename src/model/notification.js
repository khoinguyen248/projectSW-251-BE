import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Account", 
    required: true,
    index: true 
  }, // Người nhận thông báo
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["INFO", "SUCCESS", "WARNING", "ERROR"], 
    default: "INFO" 
  },
  isRead: { type: Boolean, default: false },
  relatedLink: { type: String, default: "" }, // Link dẫn tới trang chi tiết (vd: /session/123)
}, { timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;