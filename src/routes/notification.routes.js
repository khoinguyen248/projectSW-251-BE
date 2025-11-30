import { Router } from "express";
import { requireAuth } from "../middleware/auth.js"; 
import { getMyNotifications, markAsRead, markAllAsRead } from "../controller/notification.controller.js";

const router = Router();

// Sử dụng middleware requireAuth để bảo vệ các route này
router.use(requireAuth); 

router.get("/", getMyNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;