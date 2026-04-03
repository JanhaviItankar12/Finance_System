import express from "express";
import { authorizedRoles } from "../middleware/roleMiddleware.js";
import { auth } from "../middleware/authMiddleware.js";
import {  exportDashboardExcel, getDashboardSummary } from "../controllers/dashboardController.js";

const router=express.Router();

router.get("/",auth,authorizedRoles("admin" ,"analyst"),getDashboardSummary);
router.get("/export",auth,authorizedRoles("admin", "analyst"),exportDashboardExcel);



export default router;