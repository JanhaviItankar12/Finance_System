import express from "express";
import { forgotPassword, login, logout, register, resetPassword, verifyMFA } from "../controllers/authController.js";
import { authLimiter, otpLimiter, otpVerifyLimiter } from "../utils/limiter.js";
import { auth } from "../middleware/authMiddleware.js";

const router=express.Router();

//authentication
router.post("/register",register);
router.post("/login",authLimiter,login);
router.post("/logout",auth,logout);
router.post("/verify-mfa", otpVerifyLimiter, verifyMFA);
router.post("/forgot-password",otpLimiter,forgotPassword);
router.post("/reset-password",otpVerifyLimiter,resetPassword);

export default router;
