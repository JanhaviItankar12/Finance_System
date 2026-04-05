import Record from "../models/recordModel.js";
import User from "../models/userModel.js";
import { generateDashboardExcelSheet } from "../utils/generateDashboardExcelSheet.js";
import { tranEmailApi } from "../config/brevo.js";
import { generateInsightExcelSheet } from "../utils/generateInsightsExcelSheet.js";


export const sendDashboardEmail = async (period) => {
  try {
    const today = new Date();
    const filter = { isDeleted: false };

    // 1️ Set date range based on period
    if (period === "daily") {
      filter.date = { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: new Date(today.setHours(23, 59, 59, 999)) };
    } else if (period === "weekly") {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      filter.date = { $gte: lastWeek, $lte: today };
    } else if (period === "monthly") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      filter.date = { $gte: firstDay, $lte: lastDay };
    }

    // 2️ Fetch records for dashboard
    const dashboardRecords = await Record.find(filter);
    if (!dashboardRecords.length) {
      console.log(`No records found for ${period} period`);
      return;
    }

    // 3️ Generate Excel workbooks
    const dashboardWorkbook = await generateDashboardExcelSheet(dashboardRecords);
    const insightsWorkbook = await generateInsightExcelSheet({ startDate: filter.date.$gte, endDate: filter.date.$lte });

    // 4️ Convert to buffers
    const dashboardBuffer = await dashboardWorkbook.xlsx.writeBuffer();
    const insightsBuffer = await insightsWorkbook.xlsx.writeBuffer();

    // 5️ Fetch analysts
    const analysts = await User.find({ role: "analyst", isActive: true });
    if (!analysts.length) {
      console.log("No active analysts found to send email");
      return;
    }

    // 6️ Send email with both attachments
    for (const user of analysts) {
      await tranEmailApi.sendTransacEmail({
        sender: { email: process.env.FROM_EMAIL, name: "Finance Reports" },
        to: [{ email: user.email, name: user.name }],
        subject: `Finance Dashboard & Insights - ${period}`,
        htmlContent: `<p>Hello ${user.name},</p>
                      <p>Please find attached the ${period} dashboard and insights reports.</p>`,
        attachment: [
          {
            content: dashboardBuffer.toString("base64"),
            name: `dashboard_${period}_${Date.now()}.xlsx`,
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
          {
            content: insightsBuffer.toString("base64"),
            name: `insights_${period}_${Date.now()}.xlsx`,
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      });
      console.log(`Dashboard + Insights sent to ${user.email}`);
    }

  } catch (error) {
    console.error("Error sending combined email:", error);
  }
};

export const sendOTPEmail = async (email, name, otp) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Your OTP for Password Reset",

      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #2c3e50;">Password Reset Request</h2>
                    
                    <p>Hello <strong>${name}</strong>,</p>
                    
                    <p>You requested to reset your password. Use the OTP below:</p>
                    
                    <div style="
                        font-size: 24px;
                        font-weight: bold;
                        background: #f4f4f4;
                        padding: 10px 20px;
                        display: inline-block;
                        border-radius: 5px;
                        letter-spacing: 2px;
                        margin: 10px 0;
                    ">
                        ${otp}
                    </div>

                    <p>This OTP is valid for <strong>1 minute</strong>.</p>

                    <p style="color: #e74c3c;">
                        If you did not request this, please ignore this email.
                    </p>

                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>
            `
    });

    console.log("OTP email sent successfully");
    return true;

  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return false;
  }
};

export const sendMFAOTPEmail = async (email, name, otp) => {
  try {
    
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Your OTP for MFA Login",
      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #2c3e50;">Multi-Factor Authentication</h2>
                    
                    <p>Hello <strong>${name}</strong>,</p>
                    
                    <p>You have requested to log in with MFA. Use the OTP below:</p>
                    
                    <div style="
                        font-size: 24px;
                        font-weight: bold;
                        background: #f4f4f4;
                        padding: 10px 20px;
                        display: inline-block;
                        border-radius: 5px;
                        letter-spacing: 2px;
                        margin: 10px 0;
                    ">
                        ${otp}
                    </div>

                    <p>This OTP is valid for <strong>1 minute</strong>.</p>

                    <p style="color: #e74c3c;">
                        If you did not request this, please ignore this email.
                    </p>

                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>
            `
    });

    console.log("MFA OTP email sent successfully");
    return true;

  } catch (error) {
    console.error("Error sending MFA OTP email:", error);
    return false;
  }
};

export const sendDeactivationEmail = async (email, name, reason) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Account Deactivation Notice",
      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #e74c3c;">Account Deactivation</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>We regret to inform you that your account has been deactivated due to the following reason:</p>
                    <div style="
                        background: #f4f4f4;
                        padding: 10px 20px;
                        border-radius: 5px;
                        margin: 10px 0;
                    ">
                        ${reason}
                    </div>
                    <p>If you believe this is a mistake or have any questions, please contact our support team.</p>
                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>
            `
    });
    console.log("Deactivation email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending deactivation email:", error.message);
    return false;
  }
};

export const sendReactivationEmail = async (email, name) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Account Reactivation Notice",
      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #27ae60;">Account Reactivation</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>We are pleased to inform you that your account has been reactivated. You can now log in and access your account.</p>
                    <p>If you have any questions or need assistance, please contact our support team.</p>
                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>
            `
    });
    console.log("Reactivation email sent successfully");
    return true;
  }
  catch (error) {
    console.error("Error sending reactivation email:", error.message);
    return false;
  }
};

export const sendLockNotificationEmail = async (email, name, duration) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Account Lock Notification",
      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #e74c3c;">Account Locked</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Your account has been locked due to multiple failed login attempts. The lock will be in place for <strong>${duration}</strong>.</p>
                    <p>If you believe this is a mistake or have any questions, please contact our support team.</p>
                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>

            `
    });
    console.log("Lock notification email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending lock notification email:", error.message);
    return false;
  }
};

export const sendUnlockNotificationEmail = async (email, name) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Account Unlocked Notification",
      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #27ae60;">Account Unlocked</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Your account has been unlocked. You can now log in and access your account.</p>
                    <p>If you have any questions or need assistance, please contact our support team.</p>
                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>
            `
    });
    console.log("Unlock notification email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending unlock notification email:", error.message);
    return false;
  }
};


export const sendPasswordSetupEmail = async (email, name, link) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Set Up Your Password",
      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #2c3e50;">Welcome to Finance System</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Your account has been created. Please click the link below to set up your password:</p>
                    <a href="${link}" style="display: inline-block; padding: 10px 20px; background: #3498db; color: #fff; text-decoration: none; border-radius: 5px;">Set Up Password</a>
                    <p>This link is valid for 24 hours.</p>
                    <p>If you did not expect this email, please ignore it.</p>
                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>
            `
    });
    console.log("Password setup email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending password setup email:", error.message);
    return false;
  }
};

//send email to user who not created their passsord within 24 hours and their token expired
export const sendPasswordSetupReminderEmail = async (email, name) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.FROM_EMAIL,
        name: "Finance System"
      },
      to: [{ email, name }],
      subject: "Reminder: Set Up Your Password",
      htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #e67e22;">Password Setup Reminder</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>This is a reminder to set up your password for your Finance System account. Please click the link below to create your password:</p>
                    <a href="${process.env.FRONTEND_URL}/setup-password" style="display: inline-block; padding: 10px 20px; background: #3498db; color: #fff; text-decoration: none; border-radius: 5px;">Set Up Password</a>
                    <p>This link is valid for 24 hours.</p>
                    <p>If you did not expect this email, please ignore it.</p>
                    <br/>
                    <p>Regards,<br/><strong>Finance System Team</strong></p>
                </div>
            `
    });
    console.log("Password setup reminder email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending password setup reminder email:", error.message);
    return false;
  }
};













