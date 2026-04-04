import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["INFO", "ALERT", "REPORT", "SECURITY"],
    default: "INFO"
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  isRead: {
    type: Boolean,
    default: false
  },

  channel: {
    type: String,
    enum: ["EMAIL", "SYSTEM", "BOTH"],
    default: "SYSTEM"
  },

  relatedEntity: {
    type: String,
    enum: ["Record", "User"]
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId
  }

}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);