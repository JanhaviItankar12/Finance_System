import express from "express";
import { authorizedRoles } from "../middleware/roleMiddleware.js";
import { auth } from "../middleware/authMiddleware.js";
import {  exportDashboardExcel,  exportInsightExcel,  getDashboardSummary, getInsightAnalytics  } from "../controllers/dashboardController.js";
import { getAllRecordswithDeleted } from "../controllers/recordController.js";

const router=express.Router();

router.get("/",auth,getDashboardSummary);
router.get("/export",auth,authorizedRoles("admin", "analyst"),exportDashboardExcel);

//admin and analyst can view it on dashboard
router.get("/insight-analytics", auth,authorizedRoles("admin", "analyst"), getInsightAnalytics);
router.get("/export-insights", auth, authorizedRoles("admin", "analyst"),exportInsightExcel);

//admin-get all records along with deleted records
router.get("/all-records",auth,authorizedRoles("admin"),getAllRecordswithDeleted);


export default router;