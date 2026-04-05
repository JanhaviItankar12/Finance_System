import rateLimit from "express-rate-limit";

//global rate limiter
export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});

//specific limiter for login and forgot password
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many attempts from this IP, please try again after 15 minutes"
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 3, // only 3 OTP requests
  message: "Too many OTP requests. Please wait before retrying"
});

//otplimiter for OTP verification
export const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: "Too many OTP attempts from this IP, please try again after 15 minutes"
});    

