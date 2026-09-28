# USER MANUAL — PERACOM STUDENT WELFARE MANAGEMENT SYSTEM (PSWMS)

**Document Identifier:** PSWMS-UM-2026-V1
**Standard Compliance:** IEEE Std 1063-2001 (R2007) / ISO/IEC/IEEE 26514:2022
**Institution:** University of Peradeniya · Faculty of Engineering · Department of Computer Engineering
**Publication Date:** September 2026

---

## Revision History

| Version | Date | Author | Description of Changes |
|---------|------|--------|------------------------|
| 1.0 | 2026-09-24 | PeraCom Welfare Systems Team | Initial formal release |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements & Architecture](#2-system-requirements--architecture)
3. [Getting Started & Authentication](#3-getting-started--authentication)
4. [Student Module](#4-student-module)
5. [Donor Module](#5-donor-module)
6. [Admin Module](#6-admin-module)
7. [Application Status Lifecycle](#7-application-status-lifecycle)
8. [Payment Workflow](#8-payment-workflow)
9. [Troubleshooting & Error Handling](#9-troubleshooting--error-handling)
10. [Security & Data Compliance](#10-security--data-compliance)
11. [Appendices](#11-appendices)

---

## 1. Introduction

### 1.1 Purpose

This user manual provides operational instructions for navigating and utilizing the **PeraCom Student Welfare Management System (PSWMS)**. It complies with IEEE Std 1063 guidelines for software user documentation to ensure consistency, clarity, and task-oriented guidance. The manual is derived directly from the implemented system codebase, routes, and UI components.

### 1.2 Scope

This document covers end-to-end functionality across all PSWMS operational modules, including:

- Student and donor account registration, email verification, and admin approval
- Scholarship browsing and multi-step application wizard
- Document upload and admin verification workflow
- Donor scholarship request proposal and admin review
- Student-to-donor assignment workflow
- Full payment details submission, verification, and disbursement cycle
- Semester progress report submission
- Announcement publication and viewing
- Issue (support ticket) creation and tracking
- Administrative user management and account lifecycle

### 1.3 System Overview

The **PeraCom Student Welfare Management System (PSWMS)** is a centralized, web-based platform hosted at the University of Peradeniya, Faculty of Engineering, Department of Computer Engineering. It automates financial aid, scholarship discovery, applicant screening, and donor-student allocation.

**Tech Stack:**

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| Backend | Node.js + Express.js |
| Database | PostgreSQL via Supabase |
| Authentication | JWT + bcryptjs |
| File Storage | Supabase Storage (`welfare-docs` bucket) |

### 1.4 Intended Audience & Prerequisites

This manual is structured for three primary user groups:

- **Students:** Enrolled university students seeking financial assistance.
- **Donors:** External sponsors, alumni, or corporate partners funding welfare schemes.
- **Administrators:** University welfare staff and system administrators.

**Prerequisites:** Basic computer literacy, a stable internet connection, and a supported modern web browser.

### 1.5 User Roles & Permissions

| Role | Access Level | Core Operational Responsibilities |
|------|--------------|-----------------------------------|
| **Student** | Restricted (Self-profile & Applications) | Browse scholarships, apply via wizard, upload documents, track application status, submit payment details, submit progress reports, view announcements, report issues. |
| **Donor** | Restricted (Assigned Schemes & Students) | Submit scholarship proposals, review assigned student dossiers, approve/reject individual student applications, review and process payment disbursements, view announcements, report issues. |
| **Admin** | Full Administrative Access | Manage scholarship listings, review and verify applications/documents, assign approved students to donors, manage user accounts (approve/reject/suspend), manage announcements, resolve issues, review donor requests. |

### 1.6 Document Conventions

| Convention | Usage |
|------------|-------|
| **Bold** | UI labels, buttons, menus, and field names (e.g., click **Submit Application**) |
| `Monospace` | System URLs, input text, or code values |
| *Italics* | Status labels or conditions (e.g., *Pending*, *Fully Approved*) |
| > Note: | Operational preconditions, restrictions, or important callouts |

---

## 2. System Requirements & Architecture

### 2.1 Hardware Requirements

- **Processor:** Dual-Core 2.0 GHz CPU or higher
- **RAM:** Minimum 4 GB (8 GB recommended)
- **Display Resolution:** Minimum 1280x720 pixels (1920x1080 recommended)

### 2.2 Software Requirements

- **Operating System:** Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+), iOS 15+, or Android 11+
- **Document Viewer:** Built-in PDF reader or modern browser PDF plugin (for viewing uploaded documents)

### 2.3 Network & Browser Requirements

- **Supported Browsers:** Google Chrome (v100+), Mozilla Firefox (v100+), Microsoft Edge (v100+), Apple Safari (v15+)
- **Browser Settings:** JavaScript enabled, Cookies enabled, Pop-up blockers disabled for the PSWMS domain
- **Network Speed:** Minimum broadband connection of 5 Mbps (higher recommended for document uploads)

---

## 3. Getting Started & Authentication

### 3.1 Accessing the System

1. Launch a supported browser.
2. Navigate to the system URL: `http://localhost:5173` (development) or the deployed production URL.
3. The **Home Page** will display public information, available scholarships, and authentication options.

### 3.2 User Registration

The system provides separate registration flows for **Students** and **Donors**. Administrative accounts are provisioned directly by an existing system administrator and cannot be self-registered.

#### 3.2.1 Student Registration

1. On the login page, click **Student Register**.
2. Fill in the required fields:

   | Field | Details |
   |-------|---------|
   | **Full Name** | Your complete legal name |
   | **Email Address** | Your university or personal email |
   | **Phone Number** | 10-digit Sri Lankan number starting with `07` (e.g., `0771234567`) |
   | **Batch** | Select your batch from the dynamically loaded dropdown |
   | **Registration Number** | Format: `E` followed by 5 digits (e.g., `E23040`) |
   | **Password** | Minimum 6 characters |
   | **Confirm Password** | Must match the password field |

3. Click **Register as Student**.

> **Note:** After registration, you must **verify your email** and then **wait for Admin approval** before you can log in. Both steps are required.

#### 3.2.2 Donor Registration

1. On the login page, click **Donor Register**.
2. Fill in the required fields:

   | Field | Details |
   |-------|---------|
   | **Full Name** | Full name or organization representative name |
   | **Email Address** | Official contact email |
   | **Phone Number** | Contact phone number |
   | **Organization** | Organization or affiliation (e.g., Alumni Association) |
   | **Address** | Mailing address |
   | **Password** | Minimum 6 characters |
   | **Confirm Password** | Must match |

3. Click **Register as Donor**.

> **Note:** Donor accounts require admin approval before login access is granted.

### 3.3 Email Verification

After student registration:

1. Check your registered email inbox for a verification message.
2. Click the verification link in the email.
3. The system will confirm your email. You may then proceed to await admin approval.

### 3.4 Admin Account Approval

All new student and donor accounts enter a **pending approval** state after email verification. An administrator reviews and approves or rejects the account. You cannot log in until your account status is *Approved*.

### 3.5 User Login

1. Navigate to the login page.
2. Enter your registered **Email Address** and **Password**.
3. Click **Sign In**.
4. Upon successful authentication, you will be redirected to your role-specific dashboard:
   - **Admin** → `/dashboard`
   - **Student** → `/student/dashboard`
   - **Donor** → `/donor/dashboard`

> **Note:** If your account is *pending_approval* or *suspended*, an error message will be shown and access will be denied.

### 3.6 Password Recovery

1. On the login page, click **Forgot password?**
2. Enter your registered email address.
3. Click the reset button.
4. Access the reset link sent to your email, enter a new password, and confirm.

### 3.7 Session Termination (Logout)

1. Click the logout option in the navigation sidebar.
2. Your session will be cleared and you will be redirected to the login page.
3. Close the browser window on shared devices to purge any cached session data.

---

## 4. Student Module

### 4.1 Student Dashboard

After login, you arrive at the **Student Dashboard** (`/student/dashboard`).

**Dashboard elements:**

- **Welcome Banner:** Personalized greeting with your first name.
- **Payment Action Banner:** Displayed automatically if any of your applications reach *Fully Approved* status, prompting you to complete payment details. Contains a direct link to the payment page.
- **Statistics Cards (4 tiles):**
  - *Available Scholarships* — Count of active scholarships; click to browse.
  - *Active Applications* — Your current application count; click to view.
  - *Approved Scholarships* — Count of fully approved applications.
  - *Progress Reports* — Count of submitted semester progress reports.
- **Quick Actions:** Four shortcut buttons — **Browse Scholarships**, **My Applications**, **Upload Documents**, **Submit Progress**.
- **Recent Applications Table:** Displays your last 5 applications with scholarship name, submission date, and current status badge.

### 4.2 Browsing Scholarships

1. Navigate to **Scholarships** from the sidebar or the **Browse Scholarships** quick action button.
2. The page displays all *Active* scholarships as cards.
3. Use the filters at the top:
   - **Search bar:** Filter by scholarship title keyword.
   - **Batch filter:** Type a batch identifier (e.g., `20/21`) to filter by eligible batch.
4. Each scholarship card shows:
   - Scholarship title and donor name/organization (if linked)
   - Description (truncated), Funding Amount (LKR per student), Application Deadline, Eligible Batch, Eligibility Criteria
5. Click **View Details & Apply** to open the full scholarship detail and application wizard.

### 4.3 Applying for a Scholarship

The scholarship application is a **multi-step wizard** launched from the scholarship detail page (`/student/scholarships/:id`).

#### Step 1: Personal & Academic Details

- Verify auto-filled profile data (name, registration number, batch, department, email, phone).
- Enter or confirm: Current Year, Current GPA, Monthly Household Income (LKR), Number of Dependents, Home Address.

#### Step 2: Document Upload

Upload the five required standard documents plus any scholarship-specific supplementary documents:

| Required Document | Format |
|-------------------|--------|
| NIC Copy | PDF, JPG, or PNG (max 5 MB) |
| Academic Transcript | PDF, JPG, or PNG (max 5 MB) |
| Faculty Acceptance Letter | PDF, JPG, or PNG (max 5 MB) |
| Student Request Letter | PDF, JPG, or PNG (max 5 MB) |
| University ID Copy | PDF, JPG, or PNG (max 5 MB) |

> **Note:** Files must be PDF, PNG, or JPEG format and **must not exceed 5 MB** each.

#### Step 3: Review & Submit

1. Review all entered information and document uploads on the summary screen.
2. Read and accept the **accuracy declaration statement** (truthfulness declaration).
3. Click **Submit Application**.
4. The system assigns a unique Application ID. Your application status will immediately appear as *Pending*.

### 4.4 Tracking My Applications

Navigate to **My Applications** (`/student/applications`) to see all your scholarship applications.

**Features:**

- **Status filter tabs:** All, Pending, Under Admin Review, Awaiting Payment Details, Payment Details Submitted, Payment Correction Required, Payment Details Verified, Assigned to Donor, Payment Processing, Completed, Rejected, Resubmission Requested.
- **Search bar:** Filter by scholarship name or keyword.
- **Sort options:** Newest First, Oldest First, Amount High to Low, Amount Low to High.
- **Progress tracker bar:** Visual step indicator: *Applied → Admin Review → Payment Setup → Donor Review → Disbursement → Completed*.
- Each application card shows: scholarship name, submission date, funding amount, status badge, and action buttons based on current status.

**Action buttons by status:**

| Status | Available Action |
|--------|-----------------|
| *Resubmission Requested* | Re-upload documents and resubmit |
| *Awaiting Payment Details* | Link to payment details page |
| *Payment Correction Required* | Link to payment page to correct and resubmit |

### 4.5 Uploading & Managing Documents

Documents are uploaded **during the application wizard** (Step 2). If the admin flags your application with *Resubmission Requested*:

1. Go to **My Applications** and locate the flagged application.
2. Click the resubmit action button.
3. Re-upload the corrected documents and submit the corrected application.

Documents can be viewed by clicking the **View** (eye icon) on any uploaded document.

### 4.6 Payment Details Submission

After your application reaches *Fully Approved* (both admin and donor have approved), the payment details form is **automatically unlocked** and you receive a notification. The application status changes to *Awaiting Payment Details*.

**To submit payment details:**

1. From the dashboard or My Applications, click **Complete Payment Details** or navigate to `/student/payment/:applicationId`.
2. Fill in all required banking information:

   | Field | Description |
   |-------|-------------|
   | **Account Holder Name** | Full name as registered with the bank |
   | **Bank Name** | Name of your bank |
   | **Branch Name** | Bank branch |
   | **Account Number** | Your bank account number |
   | **Account Type** | Savings / Current / Fixed Deposit / Other |
   | **Contact Number** | Phone number associated with the account |

3. Upload a **Bank Passbook Scan or Bank Statement** (PDF, JPG, or PNG, max 5 MB) as proof of account.
4. Click **Submit Payment Details**.

**Payment Status Timeline displayed on page:**

1. *Payment Details Requested* — Unlocked after full approval.
2. *Payment Details Submitted* — After you submit your details.
3. *Correction Required (xN)* — If admin requests corrections (shows resubmission count).
4. *Corrected Details Submitted* — After you resubmit corrected details.
5. *Admin Verified* — Admin has verified your banking details.

**If Correction Required:** Update the incorrect fields, re-upload the bank document if needed, and click **Resubmit Payment Details**.

### 4.7 Submitting Progress Reports

Progress reports are semester-by-semester academic updates submitted to your donor after your scholarship is approved.

1. Navigate to **Progress Reports** (`/student/progress`) from the sidebar.
2. Click **New Report**.

   > **Note:** You must have at least one *Approved* scholarship application to submit a progress report.

3. Fill in the form:

   | Field | Description |
   |-------|-------------|
   | **Scholarship** | Select from your approved applications |
   | **Semester** | e.g., `Semester 5` |
   | **Current GPA** | Your current GPA (decimal, e.g., `3.75`) |
   | **Achievements** | Academic achievements this semester |
   | **Activities** | Extracurricular activities or projects |
   | **Comments** | Additional message to the donor |

4. Click **Submit Report**. Submitted reports appear in the list with their status (*Submitted* or *Reviewed*).

### 4.8 Viewing Announcements

Navigate to **Announcements** (`/student/announcements`) from the sidebar to view all published announcements targeted to *All Users* or specifically to *Students*.

### 4.9 Reporting Issues

1. Navigate to **Issue Management** (`/student/issues`) from the sidebar.
2. In the **Create New Issue** form, fill in:

   | Field | Options/Notes |
   |-------|--------------|
   | **Title** | Brief, clear issue title |
   | **Category** | Scholarship Issue / Document Issue / System Issue / Application Inquiry |
   | **Batch** | Select your batch: E24 / E23 / E22 / E21 / E20 |
   | **Description** | Detailed description of the issue |

3. Click **Submit Issue**.
4. Track all submitted issues in the **My Issues** table below (Title, Category, Status, Admin Reply, Date).

### 4.10 Managing Your Profile

Navigate to **Profile** (`/student/profile`) from the sidebar to view and update your personal information: name, phone, department, batch, current year, GPA, monthly income, number of dependents, and address.

---

## 5. Donor Module

### 5.1 Donor Dashboard

After login, you arrive at the **Donor Dashboard** (`/donor/dashboard`).

**Dashboard elements:**

- **Welcome Banner:** Personalized greeting with your first name.
- **Statistics Cards (3 tiles):**
  - *Scholarships Supported* — Number of scholarships linked to your account.
  - *Students Supported* — Total number of students assigned to you.
  - *Recent Progress Updates* — Count of recent student progress reports.
- **Supported Scholarships Panel:** Lists your active scholarships with student count and status badges; includes a **View Students** link.
- **Recent Progress Updates Panel:** Shows recent student progress reports (student name, scholarship, semester, date).

### 5.2 My Scholarships & Submitting a Scholarship Request

Navigate to **My Scholarships** (`/donor/scholarships`) from the sidebar. The page has two tabs:

#### Tab: Scholarships

Displays all scholarships linked to your donor account with status (Active/Inactive/Draft), funding amount, eligible batch, application deadline, and student count.

#### Tab: Scholarship Requests

Displays all scholarship proposals you have submitted with review status (*Pending*, *Approved*, or *Rejected*).

**To submit a new scholarship request:**

1. Click **Request New Scholarship**.
2. Complete the scholarship proposal form:

   | Field | Required | Notes |
   |-------|----------|-------|
   | **Scholarship Title** | Yes | Name of the scholarship |
   | **Funding Amount (LKR)** | Yes | Must be greater than 0 |
   | **Number of Students** | Yes | Minimum 1 |
   | **Eligible Batch(es)** | Yes | Select one or more batches |
   | **Opening Date** | Yes | Date applications open |
   | **Application Deadline** | Yes | Must be after opening date |
   | **Description** | Yes | Detailed description of the scholarship |
   | **Eligibility Criteria** | No | Additional eligibility requirements |
   | **Supplementary Documents** | No | Extra docs beyond the 5 standard |
   | **Notes** | No | Internal notes for admin |
   | **Terms** | No | Scholarship terms and conditions |

3. The five **standard required documents** (NIC Copy, Academic Transcript, Faculty Acceptance Letter, Student Request Letter, University ID Copy) are automatically included.
4. Check the **accuracy confirmation checkbox** before submitting.
5. Click **Submit Request** to send to admin for review, or **Save as Draft** to save without submitting.

### 5.3 Reviewing Assigned Students

Navigate to **My Students** (`/donor/students`) from the sidebar. The list shows each student's name, registration number, batch, scholarship name, application status, and your previous decision (if any).

Click **Review Application** (eye icon) to open the full student dossier.

### 5.4 Approving or Rejecting Student Applications

From the student review page (`/donor/students/:id/review`), inspect the full application dossier:

- **Personal Information:** Name, registration number, batch, department, email, phone.
- **Academic Details:** GPA, current year, semester.
- **Financial Details:** Monthly income, number of dependents, home address.
- **Uploaded Documents:** Each document with **View** and **Download** buttons.
- **Extra Application Data:** Any additional information submitted with the application.

**To make a decision:**

1. Review all sections carefully.
2. Scroll to the **Funding Decision** section.
3. Optionally enter a **comment** (required for rejection).
4. Click **Approve** (green) or **Reject** (red) and confirm.

> **Note:** Once both admin and donor approve, the application automatically progresses to *Fully Approved* and the student's payment details form is unlocked by the system trigger.

### 5.5 Payment Review & Disbursement

Navigate to **Payments** (`/donor/payments`) from the sidebar. This page manages fund disbursement to approved students.

**Workflow per student:**

| Step | Your Action |
|------|-------------|
| Student submits payment details | Review bank details and passbook scan |
| **Verify Payment Details** | Click to confirm bank details are correct |
| **Request Correction** | If bank details are incorrect, flag with a reason |
| **Mark as Processing** | After verification, initiate payment processing |
| **Mark as Paid** | Upload receipt (PDF/JPG/PNG, max 5 MB), enter transaction reference, payment date, and optional comments |
| **Mark as On Hold** | Temporarily pause a payment |
| **Mark as Failed** | Flag with failure reason if payment cannot be processed |

### 5.6 Viewing Announcements

Navigate to **Announcements** (`/donor/announcements`) from the sidebar to view published announcements targeted to *All Users* or specifically to *Donors*.

### 5.7 Reporting Issues

1. Navigate to **Issues** (`/donor/issues`) from the sidebar.
2. Use the **Create New Issue** form (same categories as the student module: Scholarship Issue, Document Issue, System Issue, Application Inquiry).
3. Click **Submit Issue** and track replies in the issues table.

### 5.8 Donor Profile

Navigate to **Profile** (`/donor/profile`) from the sidebar to view your registered donor information including name, email, organization, and contact details.

---

## 6. Admin Module

### 6.1 Admin Dashboard

After login, you arrive at the **Admin Dashboard** (`/dashboard`).

**Dashboard elements:**

- **Welcome Banner:** "Welcome back, Admin!"
- **Statistics Cards (4 tiles):**
  - *Pending Applications* — Applications awaiting review.
  - *Pending Doc. Verifications* — Applications with unverified documents.
  - *Reported Issues* — Open support tickets.
  - *Active Scholarships* — Currently active scholarship listings.
- **Quick Actions:** Buttons for Review Applications, Manage Scholarships, Manage Issues, Create Announcement.
- **Recent Activity Feed:** Live feed of recent system events (applications, issues, scholarship requests) with type badge, description, status, and date.

### 6.2 Managing Scholarships

Navigate to **Scholarships** (`/scholarships`) from the admin sidebar. The page shows a table of all scholarships (Active, Inactive, Draft) and a **Pending Requests** badge showing unreviewed donor requests.

**To create a new scholarship:**

1. Click **+ New Scholarship**.
2. Fill in the modal form:

   | Field | Notes |
   |-------|-------|
   | **Title** | Scholarship name (required) |
   | **Description** | Full description |
   | **Eligibility Criteria** | Eligibility rules |
   | **Eligible Batch** | e.g., `20/21` |
   | **Funding Amount (LKR)** | Per student amount |
   | **Required Documents** | Comma-separated document list |
   | **Application Deadline** | Date picker |
   | **Status** | Active / Inactive / Draft |

3. Click **Save**.

**To edit:** Click the pencil icon, modify the pre-filled form, click **Save**.
**To delete:** Click the trash icon and confirm.
**To assign students:** Click the **Assign** button next to a scholarship.

### 6.3 Reviewing Scholarship Requests from Donors

1. From the Scholarships page, click the **Pending Requests** link/badge.
2. The **Scholarship Request Review** page displays all details submitted by the donor.
3. Click **Approve** (creates the scholarship from the request) or **Reject** (provide a rejection reason).

### 6.4 Application Review & Document Verification

Navigate to **Applications** (`/applications`) from the admin sidebar. The list shows all submitted applications with student name, scholarship, submission date, status, and a **Review** button.

**To review an individual application:**

1. Click **Review** to open the Application Detail Page (`/applications/:id`).
2. The detail page shows the full student dossier:
   - Personal details snapshot (name, registration, batch, department, email, phone)
   - Academic details (GPA, current year, semester)
   - Financial details (monthly income, dependents, address)
   - Extra form data submitted with the application
3. **Document Verification:** For each uploaded document:
   - Click **View** to open and inspect the document.
   - Click **Download** to save locally.
   - Mark each document as **Verified** or **Missing/Rejected** (with a reason).
4. **Application Decision:**
   - Click **Approve** to advance the application.
   - Click **Reject** — select a rejection reason.
   - Click **Request Resubmission** — the student will be prompted to re-upload documents with your feedback.

### 6.5 Assigning Students to Donors

Navigate to the **Assign Students** page (`/scholarships/:id/assign`).

1. From the Scholarships page, click **Assign** next to the relevant scholarship.
2. The page shows:
   - **Approved Students** — Eligible to be assigned (admin-approved, not yet assigned).
   - **Assigned Students** — Already assigned to the donor for this scholarship.
3. Use the search bar to filter students.
4. Select students by checking their rows.
5. Click **Assign to Donor**.

> **Note:** The database trigger fires automatically when both admin and donor approve — setting the application to *Fully Approved* and unlocking the student's payment details form.

### 6.6 Student Management

Navigate to **Students** (`/students`) from the admin sidebar.

- View all registered students with name, email, registration number, batch, department, GPA, and status.
- Use batch filter and search to locate specific students.
- Click a student row to open the **Student Detail Page** (`/students/:id`) showing full profile, all applications, and uploaded documents.

### 6.7 Donor Management

Navigate to **Donors** (`/donors`) from the admin sidebar.

- View all registered donors with name, email, organization, status, and available fund.
- Click a donor row to open the **Donor Detail Page** (`/donors/:id`) showing profile details, linked scholarships, and assigned students.
- Available actions per donor:
  - **Approve** — Activate a pending or rejected donor account.
  - **Suspend** — Temporarily disable an approved donor account.
  - **Activate** — Re-enable a suspended donor account.

### 6.8 Announcements Management

Navigate to **Announcements** (`/announcements`) from the admin sidebar.

**To create an announcement:**

1. Click **+ New Announcement**.
2. Fill in the modal:
   - **Title** (required)
   - **Audience:** All Users / Students / Donors
   - **Content:** Announcement body text
   - **Publish Date:** For scheduled announcements
   - **Status:** Draft / Published / Scheduled
3. Click **Save**.

**To publish a draft:** Click the Publish icon next to a Draft announcement.
**To edit:** Click the pencil icon. **To delete:** Click the trash icon and confirm.
**Filter options:** Search by title keyword or filter by status.

### 6.9 Issue Management

Navigate to **Issues** (`/issues`) from the admin sidebar.

- View all submitted issues from students and donors with title, reporter name, category, batch, status, and date.
- Filter by status: Open, In Progress, Resolved, Draft.
- Click an issue to open it, write an **Admin Reply**, update the status to *In Progress* or *Resolved*, and click **Update**.

### 6.10 User Approval

Navigate to **User Approval** (`/user-approval`) from the admin sidebar.

**Statistics Cards:** Pending, Approved, Rejected counts.

**Filter tabs:** All, Pending, Approved, Rejected.

**Actions per user:**

| Current Status | Available Actions |
|----------------|------------------|
| *pending_approval* | **Approve** / **Reject** |
| *approved* | **Suspend** |
| *rejected* or *suspended* | **Approve** (re-activate) |

---

## 7. Application Status Lifecycle

The following diagram describes the complete application status progression:

```
Student Submits Application
         |
         v
    [Pending]
         |
         | Admin reviews
         v
  [Under Admin Review]  <---- [Resubmission Requested]
         |                           ^
         | Admin approves            | Admin requests corrections
         v                           |
  [Admin Approved] ------------------+
         |
         | Admin assigns student to donor
         v
  [Assigned to Donor]
         |
         | Donor approves
         v
  [Fully Approved]
  (System auto-unlocks payment form)
         |
         v
  [Awaiting Payment Details]
         |
         | Student submits bank details
         v
  [Payment Details Submitted]
         |                  <---- [Payment Correction Required]
         | Admin verifies             ^
         v                           | Admin requests correction
  [Payment Details Verified]---------+
         |
         | Donor begins payment
         v
  [Payment Processing]
         |
         | Donor marks as paid + uploads receipt
         v
      [Completed]
```

**Terminal failure state:** `[Rejected]` — can occur at admin review, resubmission, or donor review stage.

---

## 8. Payment Workflow

| Step | Actor | Action |
|------|-------|--------|
| 1 | System | Auto-unlocks student payment form when both admin and donor have approved |
| 2 | Student | Submits banking details (account holder, bank, branch, account number, type, contact, passbook scan) |
| 3 | Admin | Reviews and verifies bank details against passbook scan |
| 4 | Admin | Approves (Payment Details Verified) or Requests Correction (Payment Correction Required) |
| 5 | Student | If correction required: updates details and resubmits |
| 6 | Donor | Reviews verified payment details |
| 7 | Donor | Marks payment as Processing, then uploads receipt and marks as Paid |
| 8 | System | Updates application to Completed |

---

## 9. Troubleshooting & Error Handling

### 9.1 Common Errors and Resolutions

| Error / Symptom | Possible Cause | Resolution |
|-----------------|----------------|------------|
| "Your account is pending admin approval." | Account registered but not yet approved | Wait for admin to review and approve your account |
| "Your account has been suspended." | Account was suspended by admin | Contact the welfare office to resolve the suspension |
| "Invalid email or password" | Incorrect credentials or unverified email | Verify input; check email verification was completed; use **Forgot password?** to reset |
| File upload fails — file too large | File exceeds 5 MB limit | Compress the PDF or image before uploading |
| File upload fails — wrong format | Unsupported file type | Use only PDF, JPG, or PNG files |
| Registration number rejected | Wrong format | Format must be E followed by exactly 5 digits, e.g., E23040 |
| Phone number rejected | Wrong format | Must be a 10-digit Sri Lankan number starting with 07 |
| Cannot submit progress report | No approved application exists yet | Ensure your application is approved before submitting progress reports |
| Page not loading / blank screen | Browser cache or JavaScript issue | Clear browser cache (Ctrl+Shift+Del), reload, or try a different supported browser |
| Scholarship not showing in list | Scholarship is not Active or batch does not match | Check batch filter; contact admin if a scholarship you expect to see is missing |

### 9.2 Submitting a Support Ticket

If an issue persists:

1. Navigate to **Issues** from the student or donor sidebar.
2. Fill in the **Create New Issue** form with a clear Title, Category, Batch, and detailed Description.
3. Click **Submit Issue**.
4. Monitor the **My Issues** table for admin replies and status updates.

---

## 10. Security & Data Compliance

### 10.1 Credential & Data Security

- **Password Confidentiality:** Users must maintain strict confidentiality of their authentication credentials.
- **Session Security:** Always use the **Logout** function, especially on shared or public devices, to clear your JWT session token.
- **JWT Token Expiry:** Session tokens expire after 7 days. After expiry, re-login is required.

### 10.2 Data Authenticity & Compliance

- **Accuracy Obligation:** Students are legally responsible for all academic and financial declarations submitted in scholarship applications. Providing false or misleading information leads to immediate disqualification and may result in disciplinary action under university regulations.
- **Privacy Compliance:** Administrators and donors must handle all student records in strict accordance with university data privacy guidelines. Student personal and financial data must not be shared outside the platform.
- **Document Security:** Uploaded documents are stored in a secured Supabase Storage bucket (`welfare-docs`). Access is governed by storage policies allowing only authenticated uploads and controlled reads.

---

## 11. Appendices

### 11.1 Appendix A: Application Status Reference

| Status | Meaning | Who Sets It |
|--------|---------|-------------|
| *Pending* | Application submitted, awaiting admin review | System (auto on submission) |
| *Under Admin Review* | Admin is actively reviewing | Admin |
| *Resubmission Requested* | Admin has flagged documents for correction | Admin |
| *Admin Approved* | Admin has approved the application | Admin |
| *Assigned to Donor* | Student assigned to a donor for their scholarship | Admin |
| *Fully Approved* | Both admin and donor have approved | System (auto trigger) |
| *Awaiting Payment Details* | Payment form unlocked; waiting for student bank details | System (auto trigger) |
| *Payment Details Submitted* | Student has submitted banking information | Student |
| *Payment Correction Required* | Admin found errors in payment details | Admin |
| *Payment Details Verified* | Admin has verified bank details | Admin |
| *Payment Processing* | Donor is processing the payment | Donor |
| *Completed* | Payment has been made and confirmed | Donor |
| *Rejected* | Application or resubmission rejected | Admin or Donor |

### 11.2 Appendix B: Payment Status Reference

| Status | Meaning |
|--------|---------|
| *Locked* | Payment form not yet accessible (application not fully approved) |
| *Unlocked* | Payment form accessible; student has not yet submitted |
| *Submitted* | Student submitted payment details |
| *Correction Required* | Admin requested corrections |
| *Re-Submitted* | Student has resubmitted after correction |
| *Admin Verified* | Admin confirmed payment details are correct |
| *Pending* | Donor payment initiated, awaiting processing |
| *Processing* | Donor is processing the fund transfer |
| *Paid* | Funds disbursed; receipt uploaded |
| *On Hold* | Donor has temporarily paused the payment |
| *Failed* | Payment attempt failed; failure reason recorded |

### 11.3 Appendix C: Issue Categories Reference

| Category | Use For |
|----------|---------|
| *Scholarship Issue* | Problems related to scholarship listings or eligibility |
| *Document Issue* | Problems uploading or verifying documents |
| *System Issue* | Technical errors, bugs, or UI problems |
| *Application Inquiry* | Questions about application status or process |

### 11.4 Appendix D: Glossary of Terms

| Term | Definition |
|------|------------|
| **PSWMS** | PeraCom Student Welfare Management System |
| **Beneficiary** | A student selected and approved to receive scholarship funding |
| **Donor Pool** | Funds provided by a specific sponsor to cover a defined scholarship |
| **Fully Approved** | State when both admin and donor have approved; triggers payment unlock |
| **Progress Report** | A semester-by-semester academic update submitted by a student to their donor |
| **Scholarship Request** | A proposal submitted by a donor to admin to create a new scholarship scheme |
| **Resubmission** | A corrected re-submission of a previously rejected application or payment details |
| **JWT** | JSON Web Token — the authentication token used to maintain login sessions |
| **Supabase** | The cloud platform providing PostgreSQL database and file storage for this system |
| **Batch** | Student intake year group (e.g., E23 = intake 2023) |
| **Passbook Scan** | A scanned copy of a bank passbook or bank statement, used to verify account details |

### 11.5 Appendix E: Demo Credentials

> **Note:** These credentials are for development and testing environments only. Do not use in production.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@welfare.pdn.ac.lk` | `password` |
| Student | `anjana@student.pdn.ac.lk` | `password` |
| Donor | `neil@donor.pdn.ac.lk` | `password` |

### 11.6 Appendix F: Support & Contact Information

For technical support or administrative inquiries:

- **Helpdesk Email:** `welfare-support@welfare.pdn.ac.lk`
- **Institution:** University of Peradeniya, Faculty of Engineering, Department of Computer Engineering
- **Office Hours:** Monday - Friday, 8:30 AM - 4:30 PM (Sri Lanka Standard Time, UTC+5:30)

---

*PeraCom Student Welfare Management System (PSWMS) · University of Peradeniya · Faculty of Engineering*
*Document Version 1.0 · September 2026*
