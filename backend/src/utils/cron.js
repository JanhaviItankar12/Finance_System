import cron from "node-cron";
import { sendDashboardEmail, sendUnlockNotificationEmail } from "../services/emailService.js";
import User from "../models/userModel.js";
import { createNotification } from "./notification.js";


//Daily report -every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  try {
    await sendDashboardEmail("daily");

    //create notification for analysts
    const analysts = await User.find({ role: "analyst" });
    await Promise.all(
      analysts.map((analyst) =>
        createNotification({
          user: analyst._id,
          type: "INFO",
          title: "Daily Dashboard & Insights Report",
          message: "The daily dashboard & insights report has been sent to your email.",
          relatedEntity: "Dashboard",
          entityId: null
        })
      )
    );

    console.log("Daily dashboard & insights report sent to all analysts");
  } catch (error) {
    console.error("Error sending daily report:", error);
  }
});

// Weekly Report - every Monday at 9:00 AM
cron.schedule("0 9 * * 1", async () => {
  try {
    await sendDashboardEmail("weekly");

    //create notification for analysts
    const analysts = await User.find({ role: "analyst" });
    await Promise.all(
      analysts.map((analyst) =>
        createNotification({
          user: analyst._id,
          type: "INFO",
          title: "Weekly Dashboard & Insights Report",
          message: "The weekly dashboard & insights report has been sent to your email.",
          relatedEntity: "Dashboard",
          entityId: null
        })
      ));


    console.log(" Weekly dashboard & insights report sent to all analysts");
  } catch (error) {
    console.error(" Error sending weekly report:", error);
  }
});

// Monthly Report - 1st day of month at 9:00 AM
cron.schedule("0 9 1 * *", async () => {
  try {
    await sendDashboardEmail("monthly");

    //create notification for analysts
    const analysts = await User.find({ role: "analyst" });
    await Promise.all(
      analysts.map((analyst) =>
        createNotification({
          user: analyst._id,
          type: "INFO",
          title: "Monthly Dashboard & Insights Report",
          message: "The monthly dashboard & insights report has been sent to your email.",
          relatedEntity: "Dashboard",
          entityId: null
        })
      ));

    console.log(" Monthly dashboard & insights report sent to all analysts");
  } catch (error) {
    console.error(" Error sending monthly report:", error);
  }
});

//send unlock notification to users
cron.schedule("*/5 * * * *", async () => {
  const users = await User.find({
    lockUntil: { $lte: new Date() },
    isActive: true
  });

  await Promise.all(users.map(async (user) => {
    sendUnlockNotificationEmail(
      user.email,
      user.name
    );
    //clear lock
    user.lockUntil = null;
    await user.save();
  }
  ));
});



