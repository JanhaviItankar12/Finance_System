import express from "express";
import { forgotPassword, login, logout, register, resetPassword, verifyMFA } from "../controllers/authController.js";
import { authLimiter, otpLimiter, otpVerifyLimiter } from "../utils/limiter.js";

const router=express.Router();

//authentication
router.post("/register",register);
router.post("/login",authLimiter,login);
router.post("/logout",logout);
router.post("/auth/verify-mfa", otpVerifyLimiter, verifyMFA);
router.post("/forgot-password",otpLimiter,forgotPassword);
router.post("/reset-password",otpVerifyLimiter,resetPassword);

export default router;
