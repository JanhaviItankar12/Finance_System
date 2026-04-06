import { Parser } from "json2csv";
import AuditLog from "../models/auditLogModel.js";
import { sendDeactivationEmail, sendPasswordSetupEmail, sendPasswordSetupReminderEmail, sendReactivationEmail } from "../services/emailService.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import { createAuditLog } from "../utils/auditLog.js";
import { generateToken } from "../utils/generateToken.js";


export const getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      userId,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    if (action) {
      filter.action = { $in: action.split(",") };
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (userId) {
      filter.performedBy = userId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(filter)
      .populate("performedBy", "name email role")
      .populate("targetUserId", "name email role")
      .populate("recordId", "amount type category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLogs = await AuditLog.countDocuments(filter);

    return res.status(200).json({
      total: totalLogs,
      page: parseInt(page),
      totalPages: Math.ceil(totalLogs / limit),
      count: logs.length,
      logs
    });

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const exportAuditLogsCSV = async (req, res) => {
  try {
    const { action, userId, entityType, startDate, endDate } = req.query;

    const filter = {};

    if (action) {
      filter.action = { $in: action.split(",") };
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (userId) {
      filter.performedBy = userId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate("performedBy", "name email role")
      .populate("targetUserId", "name email role")
      .populate("recordId", "amount type category")
      .sort({ createdAt: -1 });

    const formattedLogs = logs.map(log => ({
      Action: log.action,
      Entity: log.entityType,

      PerformedBy: log.performedBy?.name,
      Email: log.performedBy?.email,
      Role: log.role,

      TargetUser: log.targetUserId?.name || "-",

      RecordId: log.recordId?._id || "-",
      Amount: log.recordId?.amount || "-",
      Type: log.recordId?.type || "-",
      Category: log.recordId?.category || "-",

      Description: log.description || "-",

      Date: new Date(log.createdAt).toISOString().slice(0, 10),
      Time: new Date(log.createdAt).toISOString().slice(11, 19)
    }));

    const parser = new Parser();
    const csv = parser.parse(formattedLogs);

    res.header("Content-Type", "text/csv");
    res.attachment(`audit_logs_${Date.now()}.csv`);

    //audit log for export action
    await createAuditLog({
      action: "EXPORT",
      entityType: "AuditLog",
      performedBy: req.user.id,
      role: req.user.role,
      description: "Exported audit logs to CSV"
    });

    return res.send(csv);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//register user by admin
export const registerUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // validation
    if (!name || !email) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    //check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }



    const user = await User.create({
      name,
      email,
      role: role || "viewer",  //default role

    });

    // generate token
    const token = generateToken(user);


    user.passwordSetupToken = token;
    user.passwordSetupExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const link = `${process.env.BACKEND_URL}/api/auth/setup-password?token=${token}`;

    await sendPasswordSetupEmail(email, name, link);


    //audit log
    await createAuditLog({
      action: "REGISTER",
      entityType: "User",
      performedBy: req.user.id,
      role: user.role,
      description: "User registered"
    });


    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })




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


export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, role, resetStatus } = req.query;

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (role) {
      filter.role = role;
    }

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    //  Reset Status Filter
    if (resetStatus === "expired") {
      filter.passwordSetupExpires = { $lt: Date.now() };
      filter.isActive = false;
    }

    if (resetStatus === "pending") {
      filter.passwordSetupExpires = { $gt: Date.now() };
      filter.isActive = false;
    }

    const users = await User.find({
      ...filter,
      role: { $ne: "admin" }
    })
      .select("-password -resetOtp -resetOtpExpiry -mfaOtp -mfaExpiry -isMfaVerified")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments({
      ...filter,
      role: { $ne: "admin" }
    });

    return res.status(200).json({
      totalUsers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
      count: users.length,
      users
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//resnt token for user who has not set password yet and token expired
export const resendReminder = async (req, res) => {
  try {
    const  id  = req.params.id;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "User already active" });
    }


    const token = generateToken(user);

    user.passwordSetupToken = token;
    user.passwordSetupExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const link = `${process.env.BACKEND_URL}/api/auth/setup-password?token=${token}`;

    await sendPasswordSetupReminderEmail(user.email, user.name, link);

    res.json({ message: "Password setup reminder sent successfully" });

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: view pending activation requests
export const getPendingActivationRequests = async (req, res) => {
  try {
    const pendingUsers = await User.find({ activationRequested: true, isActive: false });

    return res.status(200).json({ pendingUsers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }



    if (!user.isActive) {
      return res.status(400).json({ message: "User is already inactive" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Deactivation reason is required" });
    }

    user.isActive = false;
    user.deactivationReason = reason;
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.user.id;

    await user.save();

    //audit logs
    await createAuditLog({
      action: "DEACTIVATE",
      entityType: "User",
      performedBy: req.user.id,
      role: user.role,
      targetUserId: user._id,
      description: `User deactivated: ${reason}`
    });
    //send email notification to user about deactivation
    await sendDeactivationEmail(user.email, user.name, reason);

    return res.status(200).json({ message: "User deactivated successfully" });


  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "User is already active" });
    }

    if (!user.activationRequested) {
      return res.status(400).json({ message: "No activation request found for this user" });
    }

    user.isActive = true;
    user.deactivationReason = undefined;
    user.deactivatedAt = undefined;
    user.deactivatedBy = undefined;
    user.activationRequested = false;
    await user.save();

    //audit logs
    await createAuditLog({
      action: "REACTIVATE",
      entityType: "User",
      performedBy: req.user.id,
      role: user.role,
      targetUserId: user._id,
      description: "User reactivated"
    });
    //send email notification to user about reactivation
    await sendReactivationEmail(user.email, user.name);

    return res.status(200).json({ message: "User reactivated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//get all notifications 
export const getAllNotificationsforAdmin = async (req, res) => {
  try {

    //query may contain filter for read/unread ,message ,title,type,date range
    const { isRead, type, title, message, date, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user.id };

    const dateFilter = {};
    if (date) {
      const [start, end] = date.split(",");
      if (start) dateFilter.$gte = new Date(start);
      if (end) dateFilter.$lte = new Date(end);
    }

    if (Object.keys(dateFilter).length > 0) {
      filter.createdAt = dateFilter;
    }

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    if (message) {
      filter.message = { $regex: message, $options: "i" };
    }

    if (type) {
      filter.type = type;
    }

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    return res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      count: notifications.length,
      notifications
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};













