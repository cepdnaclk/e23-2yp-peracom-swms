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
