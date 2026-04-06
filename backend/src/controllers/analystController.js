import Notification from "../models/notificationModel.js";

//get all notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, isRead, type } = req.query;

    const filter = {
      user: req.user.id   
    };

    // Optional filters
    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    if (type) {
      filter.type = type;
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

//mark read
export const markAsRead = async (req, res) => {
  try {
    const id=req.params.id;
    const notification = await Notification.findOne({
      _id: id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ message: "Marked as read" });

  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

//get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.log(err.message);
    return res.status(500).json({ message: "Server error" });
  }

};




