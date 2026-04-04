import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const auth = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Not Authenticated"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //fetch fresh user from DB
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        //check if active
        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is deactivated. Contact admin."
            });
        }

        // Check temporary lock
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({
                message: "Account is temporarily locked"
            });
        }

        //attach full user
        req.user=user;

        next();
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }
}