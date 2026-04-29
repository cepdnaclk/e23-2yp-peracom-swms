# PeraCom Donor Backend v2

This backend matches your requested structure and covers:
- donor register/login
- JWT authentication
- donor role middleware
- donor dashboard API
- scholarships API
- scholarship request APIs
- approved students API
- single student profile API
- progress updates APIs
- issues APIs
- notifications API
- announcements API

## Run

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

## Environment

Fill these values in `server/.env`:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=replace-with-a-long-random-secret
```

## Important schema notes

Your current minimal schema does **not** include a separate `scholarships` table, `documents` table, or `announcements` table.
So this starter:
- uses `scholarship_requests` as the data source for `/api/donor/scholarships`
- returns `verified_documents: []` in the student profile response
- returns an empty announcements list if `announcements` table has not been created yet

## Main routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/donor/dashboard`
- `GET /api/donor/scholarships`
- `GET /api/donor/scholarship-requests`
- `POST /api/donor/scholarship-requests`
- `GET /api/donor/approved-students`
- `GET /api/donor/students/:id`
- `GET /api/donor/progress-updates`
- `GET /api/donor/progress-updates/:id`
- `POST /api/donor/issues`
- `GET /api/donor/issues`
- `GET /api/donor/notifications`
- `GET /api/announcements`
