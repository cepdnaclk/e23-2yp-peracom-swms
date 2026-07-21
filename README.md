# PeraCom Student Welfare Management System (PSWMS)

A full-stack scholarship management platform for the University of Peradeniya — connecting students, donors, and admin through a transparent, role-based portal.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| Forms | React Hook Form |
| HTTP | Axios |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| Database | PostgreSQL via Supabase |
| Auth | JWT + bcryptjs |
| Storage | Supabase Storage |
| Notifications | react-hot-toast |

---

## Project Structure

```
pswms/
├── frontend/               # React + Vite app
│   └── src/
│       ├── pages/
│       │   ├── auth/       # Login, Register, Forgot Password
│       │   ├── admin/      # All 13 admin pages
│       │   ├── student/    # 6 student pages
│       │   └── donor/      # 5 donor pages
│       ├── components/
│       │   ├── admin/      # AdminLayout
│       │   ├── student/    # StudentLayout
│       │   ├── donor/      # DonorLayout
│       │   └── common/     # Shared: Modal, StatCard, StatusBadge, etc.
│       ├── context/        # AuthContext (JWT)
│       └── services/       # Axios instance
└── backend/
    ├── routes/             # auth, scholarships, applications, student, donor, admin
    ├── middleware/         # JWT auth, file upload
    └── config/             # DB pool, Supabase client, SQL schema
```

---

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `backend/config/schema.sql`
3. Go to **Storage** → create a bucket called `welfare-docs` (set to public)
4. Copy your **Project URL** and **service_role key** from Settings → API

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
npm install
npm run dev
# API running at http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=your_min_32_char_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@welfare.pdn.ac.lk | password |
| Student | anjana@student.pdn.ac.lk | password |
| Donor | neil@donor.pdn.ac.lk | password |

---

## User Roles & Access

### Admin
- Dashboard with live stats and activity feed
- Scholarship CRUD + donor request review (approve/reject)
- Application review with approve / reject / request resubmission
- Assign approved students to donors
- Student management with batch statistics
- Donor management with approve / suspend / activate
- Announcement management (draft → publish → schedule)
- Issue tracking with replies and status updates
- User approval queue for new registrations

### Student
- Browse and apply for active scholarships (4-step wizard)
- Track application status with progress bar
- Upload supporting documents
- Submit semester progress reports
- View and edit profile

### Donor
- Submit scholarship proposals to admin
- Review assigned students and approve/reject individually
- View progress reports from supported students
- View announcements targeted to donors

---

## API Endpoints Summary

### Auth
```
POST /api/auth/login
POST /api/auth/register/student
POST /api/auth/register/donor
POST /api/auth/forgot-password
```

### Scholarships
```
GET  /api/scholarships/public          (unauthenticated)
GET  /api/scholarships                 (authenticated)
GET  /api/scholarships/:id
POST /api/scholarships                 (admin)
PUT  /api/scholarships/:id             (admin)
DELETE /api/scholarships/:id           (admin)
GET  /api/scholarships/requests        (admin)
GET  /api/scholarships/requests/:id    (admin)
POST /api/scholarships/requests/:id/approve  (admin)
POST /api/scholarships/requests/:id/reject   (admin)
GET  /api/scholarships/:id/approved-students (admin)
GET  /api/scholarships/:id/final-students    (admin)
POST /api/scholarships/:id/assign            (admin)
```

### Applications
```
GET  /api/applications                 (admin)
GET  /api/applications/:id             (admin)
GET  /api/applications/:id/documents
POST /api/applications/:id/documents   (student, multipart)
POST /api/applications/:id/approve     (admin)
POST /api/applications/:id/reject      (admin)
POST /api/applications/:id/resubmit    (admin)
```

### Student Portal
```
GET  /api/student/stats
GET  /api/student/profile
PUT  /api/student/profile
GET  /api/student/applications
POST /api/student/applications
GET  /api/student/progress-reports
POST /api/student/progress-reports
GET  /api/student/issues
POST /api/student/issues
```

### Donor Portal
```
GET  /api/donor/stats
GET  /api/donor/profile
GET  /api/donor/scholarships
GET  /api/donor/scholarship-requests
POST /api/donor/scholarship-requests
GET  /api/donor/students
POST /api/donor/students/:id/decision
GET  /api/donor/announcements
GET  /api/donor/progress-updates
GET  /api/donor/issues
POST /api/donor/issues
```

### Admin
```
GET  /api/admin/stats
GET  /api/admin/activity
GET  /api/admin/students
GET  /api/admin/batches
GET  /api/admin/student-stats
GET  /api/admin/students/:id
GET  /api/admin/students/:id/applications
GET  /api/admin/students/:id/documents
GET  /api/admin/donors
GET  /api/admin/donor-stats
GET  /api/admin/donors/:id
PUT  /api/admin/donors/:id
GET  /api/admin/donors/:id/scholarships
GET  /api/admin/donors/:id/students
POST /api/admin/donors/:id/approve
POST /api/admin/donors/:id/suspend
POST /api/admin/donors/:id/activate
GET  /api/admin/announcements
POST /api/admin/announcements
PUT  /api/admin/announcements/:id
POST /api/admin/announcements/:id/publish
DELETE /api/admin/announcements/:id
GET  /api/admin/issues
GET  /api/admin/issue-stats
PUT  /api/admin/issues/:id
GET  /api/admin/pending-users
GET  /api/admin/user-counts
POST /api/admin/users/:id/approve
POST /api/admin/users/:id/reject
POST /api/admin/users/:id/suspend
```

---

## Database Schema Overview

```
users                      — all roles (admin / student / donor)
scholarships               — active, inactive, draft
donor_scholarship_requests — proposals from donors awaiting admin review
applications               — student scholarship applications
application_documents      — uploaded files per application
donor_students             — assignment of approved students to donors
progress_reports           — semester reports from students
announcements              — admin-published notices
issues                     — reported problems from students/donors
```

---

## Production Deployment

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
# Set VITE_API_URL env var if not using Vite proxy
```

### Backend (Railway / Render / Heroku)
```bash
cd backend
# Set all env vars in dashboard
npm start
```

### Supabase Storage
- Bucket name: `welfare-docs`
- Set bucket policy to **Public** so uploaded documents are accessible via URL
- Configure CORS to allow your frontend domain

---

## Color System

All four modules (Home, Admin, Student, Donor) share the same design language:

| Token | Value |
|-------|-------|
| Primary | `#7c3aed` (purple-600) |
| Gradient | `from-purple-700 to-purple-600` |
| Light bg | `#f5f3ff` (purple-50) |
| Card | `white + border-slate-100 + shadow-sm` |
| Radius | `rounded-xl` cards, `rounded-2xl` modals |
| Font | Inter |
| Footer bg | `#1e1b4b` |
