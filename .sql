-- ============================================================
-- PSWMS — PeraCom Student Welfare Management System
-- PostgreSQL Schema (run in Supabase SQL editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (all roles: admin, student, donor)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(255) UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  role                VARCHAR(20) NOT NULL CHECK (role IN ('admin','student','donor')),
  status              VARCHAR(30) NOT NULL DEFAULT 'pending_approval'
                      CHECK (status IN ('pending_approval','approved','rejected','suspended')),
  -- Student fields
  phone               VARCHAR(30),
  department          VARCHAR(255),
  batch               VARCHAR(20),
  registration_number VARCHAR(50),
  current_year        VARCHAR(50),
  gpa                 NUMERIC(4,2),
  monthly_income      NUMERIC(12,2),
  num_dependents      INTEGER,
  address             TEXT,
  -- Donor fields
  organization        VARCHAR(255),
  available_fund      NUMERIC(14,2) DEFAULT 0,
  total_contribution  NUMERIC(14,2) DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================
-- SCHOLARSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS scholarships (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  eligibility_criteria  TEXT,
  eligible_batch        VARCHAR(20),
  funding_amount        NUMERIC(14,2),
  required_documents    TEXT,
  application_deadline  DATE,
  status                VARCHAR(20) NOT NULL DEFAULT 'Active'
                        CHECK (status IN ('Active','Inactive','Draft')),
  donor_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_status   ON scholarships(status);
CREATE INDEX IF NOT EXISTS idx_scholarships_donor_id ON scholarships(donor_id);

-- ============================================================
-- DONOR SCHOLARSHIP REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS donor_scholarship_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scholarship_title     VARCHAR(255) NOT NULL,
  funding_amount        NUMERIC(14,2) NOT NULL,
  eligible_batch        VARCHAR(20),
  application_deadline  DATE,
  description           TEXT,
  eligibility_criteria  TEXT,
  required_documents    TEXT,
  notes                 TEXT,
  status                VARCHAR(20) NOT NULL DEFAULT 'Pending'
                        CHECK (status IN ('Pending','Approved','Rejected')),
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsr_donor_id ON donor_scholarship_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status   ON donor_scholarship_requests(status);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scholarship_id        UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  -- Snapshot fields (captured at submission time)
  student_name          VARCHAR(255),
  registration_number   VARCHAR(50),
  batch                 VARCHAR(20),
  email                 VARCHAR(255),
  phone                 VARCHAR(30),
  department            VARCHAR(255),
  current_year          VARCHAR(50),
  gpa                   NUMERIC(4,2),
  monthly_income        NUMERIC(12,2),
  num_dependents        INTEGER,
  -- Decision fields
  status                VARCHAR(40) NOT NULL DEFAULT 'Pending'
                        CHECK (status IN ('Pending','Approved','Rejected','Resubmission Requested')),
  admin_reason          TEXT,
  donor_assigned        BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, scholarship_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student_id     ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_scholarship_id ON applications(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status         ON applications(status);

-- ============================================================
-- APPLICATION DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS application_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_name   VARCHAR(255) NOT NULL,
  file_name       VARCHAR(255),
  file_url        TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'Submitted'
                  CHECK (status IN ('Submitted','Verified','Missing')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_application_id ON application_documents(application_id);

-- ============================================================
-- DONOR STUDENTS (assignment table)
-- ============================================================
CREATE TABLE IF NOT EXISTS donor_students (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholarship_id  UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  donor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  donor_decision  VARCHAR(20) NOT NULL DEFAULT 'Pending'
                  CHECK (donor_decision IN ('Pending','Approved','Rejected','Not Reviewed')),
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scholarship_id, application_id)
);

CREATE INDEX IF NOT EXISTS idx_ds_donor_id      ON donor_students(donor_id);
CREATE INDEX IF NOT EXISTS idx_ds_scholarship_id ON donor_students(scholarship_id);

-- ============================================================
-- PROGRESS REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS progress_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  semester        VARCHAR(50),
  gpa             NUMERIC(4,2),
  achievements    TEXT,
  activities      TEXT,
  comments        TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'Submitted'
                  CHECK (status IN ('Submitted','Reviewed')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_student_id ON progress_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_pr_application_id ON progress_reports(application_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  audience     VARCHAR(20) NOT NULL DEFAULT 'All Users'
               CHECK (audience IN ('All Users','Students','Donors')),
  content      TEXT,
  publish_date DATE,
  status       VARCHAR(20) NOT NULL DEFAULT 'Draft'
               CHECK (status IN ('Draft','Published','Scheduled')),
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);

-- ============================================================
-- ISSUES
-- ============================================================
CREATE TABLE IF NOT EXISTS issues (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  category      VARCHAR(50) NOT NULL
                CHECK (category IN ('Scholarship Issue','Document Issue','System Issue','Application Inquiry')),
  status        VARCHAR(20) NOT NULL DEFAULT 'Open'
                CHECK (status IN ('Open','In Progress','Resolved','Draft')),
  reported_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_reply   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: password)
INSERT INTO users (name, email, password_hash, role, status)
VALUES (
  'Admin User',
  'admin@welfare.pdn.ac.lk',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u9oW',
  'admin',
  'approved'
) ON CONFLICT (email) DO NOTHING;

-- Demo student (password: password)
INSERT INTO users (name, email, password_hash, role, status, department, batch, registration_number, gpa)
VALUES (
  'Anjana Perera',
  'anjana@student.pdn.ac.lk',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u9oW',
  'student',
  'approved',
  'Computer Engineering',
  '20/21',
  'E/20/001',
  3.75
) ON CONFLICT (email) DO NOTHING;

-- Demo donor (password: password)
INSERT INTO users (name, email, password_hash, role, status, organization, available_fund)
VALUES (
  'Neil Fernando',
  'neil@donor.pdn.ac.lk',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u9oW',
  'donor',
  'approved',
  'Alumni Association',
  500000
) ON CONFLICT (email) DO NOTHING;

-- Demo scholarships
INSERT INTO scholarships (title, description, eligibility_criteria, eligible_batch, funding_amount, required_documents, application_deadline, status, donor_id)
SELECT
  'Merit Fund Scholarship',
  'A scholarship for high-achieving students with demonstrated financial need.',
  'GPA ≥ 3.5, Financial need demonstrated, Batch 20/21',
  '20/21',
  50000,
  'NIC Copy, Academic Transcript, Income Certificate, Recommendation Letter',
  NOW() + INTERVAL '60 days',
  'Active',
  u.id
FROM users u WHERE u.email = 'neil@donor.pdn.ac.lk'
ON CONFLICT DO NOTHING;

INSERT INTO scholarships (title, description, eligibility_criteria, eligible_batch, funding_amount, required_documents, application_deadline, status)
VALUES (
  'Alumni Support Grant',
  'General financial support for all engineering students.',
  'Any department, demonstrable financial need',
  '21/22',
  35000,
  'NIC Copy, Income Certificate',
  NOW() + INTERVAL '90 days',
  'Active'
) ON CONFLICT DO NOTHING;

-- Demo announcement
INSERT INTO announcements (title, audience, content, publish_date, status)
VALUES (
  'Merit Fund Scholarship Applications Now Open',
  'Students',
  'Applications for the 2025/26 Merit Fund Scholarship are now open. Eligible students from batch 20/21 can apply through the student portal before the deadline.',
  NOW(),
  'Published'
) ON CONFLICT DO NOTHING;

-- Demo issue
INSERT INTO issues (title, description, category, status)
VALUES (
  'Unable to upload income certificate',
  'I am trying to upload my income certificate but the upload button is not responding. Please help.',
  'Document Issue',
  'Open'
) ON CONFLICT DO NOTHING;


-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'welfare-docs');

-- Allow public to view/download files
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'welfare-docs');

-- Allow users to update their own files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'welfare-docs');

-- ============================================================
-- Migration 001 — Application Review Module Updates
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- ============================================================

-- 1. Add extra_data column to applications (stores extended form fields as JSON)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS extra_data TEXT;

-- 2. Add comment column to donor_students (donor rejection/approval notes)
ALTER TABLE donor_students
  ADD COLUMN IF NOT EXISTS comment TEXT;

-- 3. Add status_override support (for draft saves)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- 4. Index for faster document lookups
CREATE INDEX IF NOT EXISTS idx_docs_doc_name ON application_documents(document_name);

-- 5. Allow donors to read applications assigned to them
-- (Already handled in backend route, but this ensures RLS if enabled)

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'applications'
  AND column_name IN ('extra_data', 'is_draft', 'admin_reason');


-- ============================================================
-- Migration 002 — Payment Details Workflow
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Payment details table
CREATE TABLE IF NOT EXISTS payment_details (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id            UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  student_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Bank info
  account_holder_name       VARCHAR(255),
  bank_name                 VARCHAR(255),
  branch_name               VARCHAR(255),
  account_number            VARCHAR(100),
  account_type              VARCHAR(50),
  contact_number            VARCHAR(30),
  passbook_url              TEXT,
  passbook_file_name        TEXT,

  -- Workflow status
  payment_details_status    VARCHAR(50) NOT NULL DEFAULT 'Locked'
                            CHECK (payment_details_status IN (
                              'Locked','Unlocked','Submitted','Pending Verification',
                              'Verified','Resubmission Required','Re-Submitted'
                            )),

  -- Donor verification
  payment_verified_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  payment_verified_date     TIMESTAMPTZ,
  resubmission_reason       VARCHAR(100),
  donor_payment_comments    TEXT,
  payment_resubmission_count INTEGER DEFAULT 0,

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(application_id)
);

CREATE INDEX IF NOT EXISTS idx_pd_application_id ON payment_details(application_id);
CREATE INDEX IF NOT EXISTS idx_pd_student_id     ON payment_details(student_id);
CREATE INDEX IF NOT EXISTS idx_pd_status         ON payment_details(payment_details_status);

-- 2. Extend applications table with new status values and donor_decision tracking
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS donor_decision VARCHAR(20),
  ADD COLUMN IF NOT EXISTS donor_decision_id UUID;

-- 3. Extend the applications status CHECK to include new statuses
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'Pending','Approved','Rejected','Resubmission Requested',
    'Admin Approved','Donor Approved','Fully Approved',
    'Payment Details Submitted','Payment Verified','Completed'
  ));

-- 4. Notifications table (for student dashboard alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  message      TEXT,
  is_read      BOOLEAN DEFAULT FALSE,
  link         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read ON notifications(is_read);

-- 5. Helper function: auto-unlock payment details when both admin + donor approve
CREATE OR REPLACE FUNCTION check_and_unlock_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_app_id UUID;
  v_student_id UUID;
  v_admin_approved BOOLEAN;
  v_donor_approved BOOLEAN;
BEGIN
  v_app_id := NEW.application_id;

  SELECT
    student_id,
    (status = 'Approved') INTO v_student_id, v_admin_approved
  FROM applications WHERE id = v_app_id;

  SELECT EXISTS(
    SELECT 1 FROM donor_students
    WHERE application_id = v_app_id AND donor_decision = 'Approved'
  ) INTO v_donor_approved;

  IF v_admin_approved AND v_donor_approved THEN
    -- Update application to Fully Approved
    UPDATE applications SET status = 'Fully Approved', updated_at = NOW()
    WHERE id = v_app_id;

    -- Unlock or create payment details row
    INSERT INTO payment_details (application_id, student_id, payment_details_status)
    VALUES (v_app_id, v_student_id, 'Unlocked')
    ON CONFLICT (application_id) DO UPDATE SET payment_details_status = 'Unlocked', updated_at = NOW();

    -- Notify student
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      v_student_id,
      'payment_unlocked',
      'Payment Details Unlocked!',
      'Congratulations! Your scholarship application has been approved by both Admin and Donor. Please complete your Payment Details to receive scholarship funds.',
      '/student/applications'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger on donor_students update
DROP TRIGGER IF EXISTS trg_check_payment_unlock ON donor_students;
CREATE TRIGGER trg_check_payment_unlock
  AFTER INSERT OR UPDATE OF donor_decision ON donor_students
  FOR EACH ROW EXECUTE FUNCTION check_and_unlock_payment();

-- 6. Seed locked payment_details rows for existing approved applications
INSERT INTO payment_details (application_id, student_id, payment_details_status)
SELECT a.id, a.student_id, 'Locked'
FROM applications a
WHERE a.status IN ('Approved','Fully Approved')
ON CONFLICT (application_id) DO NOTHING;