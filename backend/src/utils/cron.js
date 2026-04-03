import cron from "node-cron";
import { sendDashboardEmail } from "../services/emailService.js";


//Daily report -every day at 9:00 AM
cron.schedule("0 9 * * *",async()=>{
    try {
      await sendDashboardEmail("daily");
      console.log("Daily dashboard report sent to all analysts");
    }  catch (error) {
    console.error("Error sending daily report:", error);
  }
})

// Weekly Report - every Monday at 9:00 AM
cron.schedule("0 9 * * 1", async () => {
  try {
    await sendDashboardEmail("weekly");
    console.log(" Weekly dashboard report sent to all analysts");
  } catch (error) {
    console.error(" Error sending weekly report:", error);
  }
});

// Monthly Report - 1st day of month at 9:00 AM
cron.schedule("0 9 1 * *", async () => {
  try {
    await sendDashboardEmail("monthly");
    console.log(" Monthly dashboard report sent to all analysts");
  } catch (error) {
    console.error(" Error sending monthly report:", error);
  }
});