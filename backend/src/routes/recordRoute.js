import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { authorizedRoles } from "../middleware/roleMiddleware.js";
import { createRecord, deleteRecord, getRecords, lockRecord, restoreRecord, updateRecord } from "../controllers/recordController.js";

const router=express.Router();

router.post("/",auth,authorizedRoles("admin"),createRecord);
router.patch("/:id",auth,authorizedRoles("admin"),updateRecord);
router.delete("/:id",auth,authorizedRoles("admin"),deleteRecord);
router.put("/:id/lock",auth,authorizedRoles("admin"),lockRecord);
router.put("/:id/restore",auth,authorizedRoles("admin"),restoreRecord);

//get-record route
router.get("/",auth,getRecords);

export default router;
