import express from "express";

import { requestAccountActivation } from "../controllers/userController.js";

const router=express.Router();

router.post("/request-activation",requestAccountActivation);
 

export default router;