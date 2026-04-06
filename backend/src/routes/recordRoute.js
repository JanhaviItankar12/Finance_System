import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { authorizedRoles } from "../middleware/roleMiddleware.js";
import { createRecord, deleteRecord, getRecordById, getRecords, lockRecord, restoreRecord, updateRecord } from "../controllers/recordController.js";

const router=express.Router();

router.post("/",auth,authorizedRoles("admin"),createRecord);
router.patch("/:id",auth,authorizedRoles("admin"),updateRecord);
router.delete("/:id",auth,authorizedRoles("admin"),deleteRecord);
router.patch("/:id/lock",auth,authorizedRoles("admin"),lockRecord);
router.patch("/:id/restore",auth,authorizedRoles("admin"),restoreRecord);

//get-record route
router.get("/",auth,getRecords);
router.get("/:id",auth,getRecordById);



export default router;
