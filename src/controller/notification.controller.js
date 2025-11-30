
import Notification from "../model/notification.js";

// GET /notifications
export async function getMyNotifications(req, res) {
  try {
    const notifications = await Notification.find({ userId: req.user.sub })
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .limit(20);
      
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.sub, 
      isRead: false 
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
}

// PATCH /notifications/:id/read
export async function markAsRead(req, res) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
}

// PATCH /notifications/read-all
export async function markAllAsRead(req, res) {
    try {
      await Notification.updateMany(
        { userId: req.user.sub, isRead: false },
        { isRead: true }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error updating notifications" });
    }
}