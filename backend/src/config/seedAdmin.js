import mongoose from "mongoose";
import User from "../models/userModel.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

dotenv.config({path:path.resolve(__dirname,"../../.env")});

const createAdmin = async () => {
    try {
        // check if admin already exists
        const existingAdmin = await User.findOne({
            email: process.env.ADMIN_EMAIL
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit();
        }
        const admin = new User({
            name: process.env.ADMIN_NAME,
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin'
        });

        await admin.save();
        console.log("Admin created successfully");
        process.exit();
    }
    catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

connectDB().then(createAdmin);