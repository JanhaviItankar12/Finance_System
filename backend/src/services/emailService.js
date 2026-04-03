import Record from "../models/recordModel.js";
import User from "../models/userModel.js";
import { generateDashboardExcelSheet } from "../utils/generateDashboardExcelSheet.js";
import { tranEmailApi } from "../config/brevo.js";


export const sendDashboardEmail = async (period) => {
  try {
    
    const filter = { isDeleted: false };
    const today = new Date();

    if (period === "daily") {
      filter.date = { $gte: new Date(today.setHours(0,0,0,0)), $lte: new Date(today.setHours(23,59,59,999)) };
    } else if (period === "weekly") {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      filter.date = { $gte: lastWeek, $lte: today };
    } else if (period === "monthly") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      filter.date = { $gte: firstDay, $lte: lastDay };
    }

    const records = await Record.find(filter);

    if (!records.length) {
      console.log(`No records found for ${period} period`);
      return;
    }

    const workbook = await generateDashboardExcelSheet(records);

    // convert to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // send email using nodemailer (example)
    const analysts = await User.find({ role: "analyst", isActive: true });

    if (!analysts.length) {
      console.log("No active analysts found to send email");
      return;
    }

    // Send email using Brevo
    for (const user of analysts) {
      await tranEmailApi.sendTransacEmail({
        sender: { email: process.env.EMAIL, name: "Finance Dashboard" },
        to: [{ email: user.email, name: user.name }],
        subject: `Finance Dashboard Report - ${period}`,
        htmlContent: `<p>Hello ${user.name},</p><p>Please find attached the ${period} dashboard report.</p>`,
        attachment: [
          {
            content: buffer.toString("base64"), // Brevo requires base64 string
            name: `dashboard_${period}_${Date.now()}.xlsx`,
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      });
      console.log(`Dashboard sent to ${user.email}`);
    }

    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error sending dashboard email" });
  }
};