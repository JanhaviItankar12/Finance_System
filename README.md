# 💰 Finance Dashboard Backend System

A scalable and secure backend system for managing financial data with **Role-Based Access Control (RBAC)**, **Multi-Factor Authentication (MFA)**, **automated reporting**, and **audit tracking**.

This project demonstrates real-world backend engineering practices including **data integrity, security, scheduling, and analytics processing**.

Deployed Link=https://finance-system-srwg.onrender.com

---

## 🚀 Overview

The system enables different types of users (Admin, Analyst, Viewer) to interact with financial data based on their permissions. It focuses on:

* Secure authentication & authorization
* Financial data management
* Advanced analytics & insights
* Automated reporting via email
* Audit logging and monitoring

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Authentication:** JWT + MFA (OTP via Email)
* **Email Service:** Brevo
* **Scheduling:** Node Cron
* **Export:** exceljs, json2csv
* **Security:** express-rate-limit

---

## 👥 User Roles & Capabilities

### 🔴 Admin (Full Access)

#### User Management

* Create users and assign roles
* Sends **email token (valid for 24 hours)** for account activation
* Resend activation token if user fails to set password
* View all users
* Activate / deactivate users
* Handle user violation requests

#### Records Management

* Create financial records
* Update records
* Soft delete & restore records
* Lock records (prevents further modification → ensures **data integrity**)
* View all records including deleted ones

#### Monitoring & Control

* View all notifications
* Access **audit logs**
* Export audit logs in **CSV format**

#### Features

* Export insights & summary in **Excel**
  

#### MFA Security

* Login requires OTP verification via email

---

### 🔵 Analyst

#### Access

* Dashboard summary + advanced insights
* Financial analytics and reports

#### Features

* Export insights & summary in **Excel**
* Receives **automated reports (daily, weekly, monthly at 9 AM)**
* Reports available:

  * Email
  * Dashboard notifications (mark as read)

#### MFA Security

* Login requires OTP verification via email

---

### 🟢 Viewer

#### Access

* View dashboard summary
* View records and record details


---

## 🔐 Authentication & Security

* JWT-based authentication
* MFA (OTP via email) for Analyst & Admin
* Rate limiting to prevent abuse
* Account lock mechanism:

  * 5 failed attempts → account locked
  * Auto unlock after 24 hours (cron job)
* Email-based password setup (24-hour token validity)
* Email notification on account lock/unlock
* Can request admin for account reactivation
* Forgot password functionality

---

## 💰 Financial Records Management

* Create, update, delete (soft delete)
* Restore deleted records
* Record locking system:

  * Prevents modification after locking
  * Ensures data consistency and prevents corruption
* Filtering support:

  * Date
  * Category
  * Type (Income/Expense)
  * isLocked
  * Page
  * Limit
  * Search
    
---

## 📊 Dashboard Summary (Viewer, Analyst, Admin)

* Total Income
* Total Expenses
* Locked & Unlocked Income/Expenses
* Net Balance
* Income vs Expense Ratio
* Category-wise data
* Weekly & Monthly trends
* Top income/expense categories
* Growth metrics
* Recent transactions

---

## 📈 Advanced Insights (Analyst & Admin)

### 🔹 Category Analysis

* Total income & expenses
* Income/expense breakdown
* Highest & lowest categories

### 🔹 Unified Trends

* Income growth & trends
* Expense growth & trends

### 🔹 Spending Patterns

* Average spending per day
* Peak spending
* Most frequent category
* Expense distribution
* Total spending & active days

### 🔹 Top & Bottom Categories

* Income & expense comparison

### 🔹 Financial Health

* Total income & expenses
* Savings & savings rate
* Expense-to-income ratio
* Health status (chart data)


* Filtering support:

  * Range  
  * Page
  * Limit
  * StartDate
  * EndDate

---

## ⏰ Automated Reporting System

* Reports generated using **cron jobs**
* Sent at **9:00 AM**
* Frequency:

  * Daily
  * Weekly
  * Monthly

### Delivery Channels

* Email (Excel reports)
* Dashboard notifications

---

## 🔔 Notifications System

* Real-time notifications for:

  * Reports
 

* Analyst can:

  * View notifications
  * Mark as read

---

## 🧾 Audit Logging

Tracks all critical system activities:

* User actions
* Record operations
* System events

📤 Export supported in **CSV format**

---

## 📤 Export Features

* Excel export:

  * Dashboard summary
  * Insights

* CSV export:

  * Audit logs

---

## ⚙️ Cron Jobs

Automated background tasks:

* Send reports (daily/weekly/monthly at 9 AM)
* Unlock accounts after 24 hours
* Notify users about account unlock

---

## 📁 Project Structure

```
backend/
  src/
    config
    controllers/
    helperFunctions/
    middleware/
    models/
    routes/
    services/
    utils/

```

---


🔗 📡 API Endpoints
🔐 Authentication APIs
* POST	/api/auth/login	Login user (JWT + MFA for Admin/Analyst)
* POST  /api/auth/logout Logout user
* POST	/api/auth/verify-mfa	Verify OTP for MFA	
* POST	/api/auth/forgot-password	Send reset password email
* POST	/api/auth/reset-password	Reset password using otp	
* POST	/api/auth/set-password	Set password for new user	using token through query

👥 User Management (Admin Only)
* POST	/api/admin/register	Create user & send activation email
* GET	/api/admin/users	Get all users
* POST	/api/admin/users/:id/activate	Activate user
* POST	/api/admin/users/:id/deactivate	Deactivate user
* GET   /api/admin/users/pending-activations  Activation Pending Requests
* POST	/api/admin/users/:id/resend-reminder	Resend activation token

💰 Financial Records
* GET	/api/record/	Get all records (filters supported)	
* GET	/api/record/:id	Get record details
* POST /api/record/  Create Record
* PATCH	/api/record/:id	Update record	
* DELETE	/api/record/:id	Soft delete record	
* PATCH	/api/record/:id/restore	Restore deleted record	
* PATCH	/api/record/:id/lock	Lock record (prevent modification)

📊 Dashboard APIs
* GET	/api/dashboard/	Get dashboard summary	to all 
* GET	/api/dashboard/insight-analytics	Get advanced insights visible to admin and analyst

📤 Export APIs
* GET	/api/dashboard/export	Export summary (Excel)	Analyst, Admin
* GET	/api/dashboard/export-insights	Export insights (Excel)	Analyst, Admin
* GET	/api/admin/audit-logs/export	Export audit logs (CSV)	Admin

🔔 Notifications APIs
* GET	/api/admin/notifications	Get user notifications -Analyst
* PATCH	/api/analyst/notifications/:id/mark-read analyst can mark notification as Read

🧾 Audit Logs (Admin Only)
* GET	/api/admin/audit-logs	Get all audit logs



## 🌐 Deployment

* Hosted on **Render**



## 📌 Key Highlights

* ✅ Role-Based Access Control (RBAC)
* ✅ Multi-Factor Authentication (MFA)
* ✅ Record Locking (Data Integrity)
* ✅ Automated Reporting System
* ✅ Audit Logging & Monitoring
* ✅ Secure Account Management
* ✅ Scalable Backend Architecture

---

## 💡 Future Improvements

* Swagger API documentation
* Unit & integration testing
* Frontend dashboard integration

---

## 👩‍💻 Author

**Janhavi Itankar**

---

⭐ If you found this project useful, consider giving it a star!
