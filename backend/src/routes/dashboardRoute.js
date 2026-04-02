import express from "express";
import { authorizedRoles } from "../middleware/roleMiddleware.js";
import { auth } from "../middleware/authMiddleware.js";
import { exportCategoryCSV, exportDashboardCSV, exportTopCategoriesCSV, exportWeeklyTrends, getDashboardSummary } from "../controllers/dashboardController.js";

const router=express.Router();

router.get("/",auth,authorizedRoles("admin" ,"analyst"),getDashboardSummary);
router.get("/export",auth,authorizedRoles("admin", "analyst"),exportDashboardCSV);
router.get("/export/weekly",auth,authorizedRoles("admin", "analyst"),exportWeeklyTrends);
router.get("/export/category",auth,authorizedRoles("admin", "analyst"),exportCategoryCSV);
router.get("/export/top-categories",auth,authorizedRoles("admin", "analyst"),exportTopCategoriesCSV);


export default router;