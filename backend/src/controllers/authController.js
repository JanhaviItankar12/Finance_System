import bcrypt from "bcryptjs";
import { generateOTP } from "../utils/generateOtp.js";
import { generateToken } from "../utils/generateToken.js";
import User from "./../models/userModel.js"
import { sendLockNotificationEmail, sendMFAOTPEmail, sendOTPEmail } from "../services/emailService.js";
import { createAuditLog } from "../utils/auditLog.js";



//login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        //validation    
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password required"
            });
        }

        //check user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is deactivated. Contact admin."
            });
        }

        //MFA for analyst and admin
        if (["analyst", "admin"].includes(user.role)) {
            const otp = generateOTP();

            user.mfaOtp = await bcrypt.hash(otp, 10);
            user.mfaExpiry = Date.now() + 3 * 60 * 1000; //3 minutes
            await user.save();

            await sendMFAOTPEmail(user.email, user.name, otp);

            return res.status(200).json({
                message: "MFA OTP sent to email",
                mfaRequired: true,
                userId: user._id
            });

        }

        //check if active
        if (!user.isActive) {
            return res.status(403).json({
                message: "User is inactive"
            })
        }

        // Check if account is temporarily locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({
                message: "Account locked. Try again later"
            });
        }

        //compare password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            user.failedAttempts += 1;

            // Lock account after 5 failed attempts
            if (user.failedAttempts >= 5) {
                user.lockUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
                user.failedAttempts = 0; // reset counter after lock

                //duration
                const lockDuration = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000)); // in minutes

                //send email notification about lock
                await sendLockNotificationEmail(user.email, user.name, lockDuration);

                //audit log
                await createAuditLog({
                    action: "LOCK",
                    entityType: "User",
                    targetUserId: user._id,
                    role: user.role,
                    description: "Account locked due to multiple failed login attempts"
                });
            }

            await user.save();

            return res.status(400).json({ message: "Invalid credentials" });
        }

        //generate token
        const token = generateToken(user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,  //true is production-HTTPS
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000  //1 day
        });

        // Successful login
        user.failedAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        //audit log
        await createAuditLog({
            action: "LOGIN",
            entityType: "User",
            performedBy: user._id,
            role: user.role,
            description: "User logged in"
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: "Server error"
        })
    }
};

//verify-MFA OTP
export const verifyMFA = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ message: "User ID and OTP are required" });
        }
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is deactivated. Contact admin."
            });
        }

        if (!user.mfaOtp || !user.mfaExpiry || user.mfaExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP expired. Please login again." });
        }

        const isMatch = await bcrypt.compare(otp, user.mfaOtp);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.isMfaVerified = true;
        user.mfaOtp = undefined;
        user.mfaExpiry = undefined;
        await user.save();

        //generate token
        const token = generateToken(user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,  //true in production-HTTPS
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000  //1 day
        });



        res.status(200).json({
            message: "MFA verification successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

//logout
export const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        //audit log
        await createAuditLog({
            action: "LOGOUT",
            entityType: "User",
            performedBy: req.user.id,
            role: req.user.role,
            description: "User logged out"
        });
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error" });
    }
}

//forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated. Contact admin." });
        }
        if (user.resetOtpExpiry && user.resetOtpExpiry > Date.now()) {
            return res.status(400).json({ message: "OTP already sent. Wait before retry." });
        }

        //generate OTP
        const otp = generateOTP();

        user.resetOtp = await bcrypt.hash(otp, 10);
        user.resetOtpExpiry = Date.now() + 3 * 60 * 1000;    //3 minutes
        await user.save();

        //send email using brevo
        await sendOTPEmail(user.email, user.name, otp);

        //audit log
        await createAuditLog({
            action: "FORGOT_PASSWORD",
            entityType: "User",
            performedBy: user._id,
            role: user.role,
            description: "User requested password reset OTP"
        });

        res.status(200).json({ message: "OTP sent to email" });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

//reset-password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP and new password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is deactivated. Contact admin."
            });
        }

        if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }



        user.password = newPassword;
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        await user.save();

        //audit log
        await createAuditLog({
            action: "RESET_PASSWORD",
            entityType: "User",
            performedBy: user._id,
            role: user.role,
            description: "User reset password"
        });


        res.status(200).json({ message: "Password reset successful" });


    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: Object.values(error.errors)
                    .map(err => err.message)
                    .join(", ")
            });
        }
        console.log(error.message);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

export const setPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      passwordSetupToken: token,
      passwordSetupExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.isActive = true;

    // clear token
    user.passwordSetupToken = undefined;
    user.passwordSetupExpires = undefined;

    await user.save();

    res.json({ message: "Password set successfully. You can now login." });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};











