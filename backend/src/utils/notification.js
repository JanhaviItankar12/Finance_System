import Notification from "../models/notificationModel.js";

export const createNotification = async ({
  user,
  type,
  title,
  message,
  channel = "SYSTEM",
  relatedEntity,
  entityId
}) => {
  try {
    await Notification.create({
      user,
      type,
      title,
      message,
      channel,
      relatedEntity,
      entityId
    });
  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};