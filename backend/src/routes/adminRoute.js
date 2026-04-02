import express from "express";
import { authorizedRoles } from "../middleware/roleMiddleware.js";
import { auth } from "../middleware/authMiddleware.js";
import { exportAuditLogsCSV, getAuditLogs } from "../controllers/adminController.js";

const router=express.Router();

// logs
router.get("/audit-logs", auth, authorizedRoles("admin"), getAuditLogs);
router.get("/audit-logs/export",auth,authorizedRoles("admin"),exportAuditLogsCSV);

export default router;