import { Parser } from "json2csv";
import AuditLog from "../models/auditLogModel.js";
import { sendDeactivationEmail, sendReactivationEmail } from "../services/emailService.js";
import User from "../models/userModel.js";


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

    return res.send(csv);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//get all users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, role } = req.query;

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

    const users = await User.find({
      ...filter,
      role: { $ne: "admin" }   // exclude admins
    })
      .select("-password -resetOtp -resetOtpExpiry -mfaOtp -mfaExpiry -isMfaVerified")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

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

export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params.id;
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
    user.deactivatedBy = req.user._id;

    await user.save();

    //audit logs
    await createAuditLog({
      action: "DEACTIVATE",
      entityType: "User",
      performedBy: req.user._id,
      role: req.user.role,
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
    const { userId } = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "User is already active" });
    }

    user.isActive = true;
    user.deactivationReason = undefined;
    user.deactivatedAt = undefined;
    user.deactivatedBy = undefined;
    await user.save();

    //audit logs
    await createAuditLog({
      action: "REACTIVATE",
      entityType: "User",
      performedBy: req.user._id,
      role: req.user.role,
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






