import express from "express";
import { getNotifications, getUnreadCount, markAsRead } from "../controllers/analystController.js";
import { auth } from "../middleware/authMiddleware.js";
import { authorizedRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/notifications",auth,authorizedRoles("analyst"),getNotifications);
router.patch("/notifications/:id/mark-read", auth, authorizedRoles("analyst"), markAsRead);
router.get("/notifications/unread-count", auth, authorizedRoles("analyst"), getUnreadCount);


export default router;