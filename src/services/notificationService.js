import Notification from "../model/notification.js";
import Account from "../model/account.js";
import { sendEmail } from "./emailService.js";

/**
 * Tạo thông báo lưu DB và gửi Email
 * @param {string} userId - ID người nhậngit add src/routes/notification.routes.js
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung ngắn
 * @param {string} emailContent - Nội dung HTML email (nếu null sẽ không gửi mail)
 * @param {string} link - Link chuyển hướng trên web
 */
export async function createNotification({ userId, title, message, type = "INFO", emailContent = null, link = "" }) {
  try {
    // 1. Lưu vào DB
    await Notification.create({
      userId,
      title,
      message,
      type,
      relatedLink: link
    });

    // 2. Gửi Email (nếu có nội dung email)
    if (emailContent) {
      const user = await Account.findById(userId);
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: `[Tutor System] ${title}`,
          html: emailContent
        });
      }
    }
  } catch (error) {
    console.error("Create notification error:", error);
  }
}