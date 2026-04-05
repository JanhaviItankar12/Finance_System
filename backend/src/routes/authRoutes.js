import express from "express";
import { forgotPassword, login, logout, resetPassword, setPassword, verifyMFA } from "../controllers/authController.js";
import { authLimiter, otpLimiter, otpVerifyLimiter } from "../utils/limiter.js";
import { auth } from "../middleware/authMiddleware.js";

const router=express.Router();

//authentication

router.post("/login",authLimiter,login);
router.post("/logout",auth,logout);
router.post("/verify-mfa", otpVerifyLimiter, verifyMFA);
router.post("/forgot-password",otpLimiter,forgotPassword);
router.post("/reset-password",otpVerifyLimiter,resetPassword);
router.post("/setup-password", setPassword);

export default router;
