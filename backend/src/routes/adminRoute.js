import express from "express";
import { authorizedRoles } from "../middleware/roleMiddleware.js";
import { auth } from "../middleware/authMiddleware.js";
import { deactivateUser, exportAuditLogsCSV, getAllNotificationsforAdmin, getAllUsers, getAuditLogs, getPendingActivationRequests, reactivateUser } from "../controllers/adminController.js";

const router=express.Router();

// logs
router.get("/audit-logs", auth, authorizedRoles("admin"), getAuditLogs);
router.get("/audit-logs/export",auth,authorizedRoles("admin"),exportAuditLogsCSV);

//get all users
router.get("/users",auth,authorizedRoles("admin"),getAllUsers);

//activate and deactivate user
router.get("/users/pending-activations", auth, authorizedRoles("admin"), getPendingActivationRequests);
router.post("/users/:id/activate", auth, authorizedRoles("admin"), reactivateUser);
router.post("/users/:id/deactivate", auth, authorizedRoles("admin"), deactivateUser);

//get all notifications for admin
router.get("/notifications",auth,authorizedRoles("admin"),getAllNotificationsforAdmin);

export default router;