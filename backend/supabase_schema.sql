-- ============================================================
-- Student Welfare Management System — Supabase SQL Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. DONORS
create table if not exists donors (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  organization       text,
  email              text unique not null,
  phone              text,
  address            text,
  status             text default 'Pending Approval'
                     check (status in ('Active','Pending Approval','Suspended','Inactive')),
  available_fund     numeric(12,2) default 0,
  total_contribution numeric(12,2) default 0,
  notes              text,
  registered_at      timestamptz default now(),
  created_at         timestamptz default now()
);

-- 2. SCHOLARSHIPS
create table if not exists scholarships (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text,
  eligibility_criteria text,
  eligible_batch       text,
  deadline             date,
  funding_amount       numeric(12,2),
  required_documents   text,
  donor_id             uuid references donors(id) on delete set null,
  status               text default 'Active'
                       check (status in ('Active','Inactive','Draft')),
  created_at           timestamptz default now()
);

-- 3. DONOR SCHOLARSHIP REQUESTS
create table if not exists donor_scholarship_requests (
  id                   uuid primary key default gen_random_uuid(),
  donor_id             uuid references donors(id) on delete cascade,
  donor_name           text not null,
  scholarship_title    text not null,
  description          text,
  funding_amount       numeric(12,2),
  eligibility_criteria text,
  eligible_batch       text,
  application_deadline date,
  required_documents   text,
  notes                text,
  status               text default 'Pending'
                       check (status in ('Pending','Approved','Rejected')),
  rejection_reason     text,
  created_at           timestamptz default now()
);

-- 4. APPLICATIONS
create table if not exists applications (
  id                    uuid primary key default gen_random_uuid(),
  scholarship_id        uuid references scholarships(id) on delete set null,
  scholarship_title     text,
  student_name          text not null,
  registration_number   text,
  batch                 text,
  email                 text,
  phone                 text,
  department            text,
  current_year          text,
  gpa                   numeric(4,2),
  monthly_income        numeric(12,2),
  dependents            integer,
  status                text default 'Pending'
                        check (status in ('Pending','Approved','Rejected','Resubmission Requested')),
  admin_reason          text,
  created_at            timestamptz default now()
);

-- 5. APPLICATION DOCUMENTS
create table if not exists application_documents (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references applications(id) on delete cascade,
  document_name   text not null,
  file_url        text,
  status          text default 'Pending'
                  check (status in ('Pending','Verified','Rejected')),
  created_at      timestamptz default now()
);

-- 6. DONOR SCHOLARSHIPS (link table — one donor can support many scholarships)
create table if not exists donor_scholarships (
  id             uuid primary key default gen_random_uuid(),
  donor_id       uuid references donors(id) on delete cascade,
  scholarship_id uuid references scholarships(id) on delete cascade,
  created_at     timestamptz default now(),
  unique(donor_id, scholarship_id)
);

-- 7. DONOR STUDENTS (assigned students)
create table if not exists donor_students (
  id             uuid primary key default gen_random_uuid(),
  donor_id       uuid references donors(id) on delete cascade,
  scholarship_id uuid references scholarships(id) on delete cascade,
  application_id uuid references applications(id) on delete cascade,
  note           text,
  assigned_at    timestamptz default now(),
  unique(donor_id, scholarship_id, application_id)
);

-- 8. ANNOUNCEMENTS
create table if not exists announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  audience     text default 'All Users'
               check (audience in ('All Users','Students','Donors')),
  content      text not null,
  publish_date date,
  status       text default 'Draft'
               check (status in ('Draft','Published','Scheduled')),
  created_at   timestamptz default now()
);

-- 9. ISSUES
create table if not exists issues (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  reported_by text not null,
  category    text default 'System Issue'
              check (category in ('Scholarship Issue','Document Issue','System Issue','Application Inquiry')),
  status      text default 'Open'
              check (status in ('Open','In Progress','Resolved','Draft')),
  admin_reply text,
  created_at  timestamptz default now()
);

-- ============================================================
-- SAMPLE DATA — Remove if not needed
-- ============================================================

insert into donors (name, organization, email, phone, available_fund, total_contribution, status) values
  ('Neil Fernando',      'Alumni Association', 'neil@email.com',   '+94 71 234 5678', 300000, 500000, 'Active'),
  ('Anuki Wijesinghe',   'Individual Donor',   'anuki@email.com',  '+94 77 111 2222', 200000, 350000, 'Active'),
  ('Gihan Fernando',     'Company ABC',        'gihan@email.com',  '+94 76 333 4444', 150000, 150000, 'Active'),
  ('Rukmal Abeysekara',  'Foundation XYZ',     'rukmal@email.com', '+94 75 555 6666', 120000, 400000, 'Suspended');

insert into scholarships (title, description, eligibility_criteria, eligible_batch, deadline, funding_amount, status) values
  ('Merit Fund Scholarship', 'For high-achieving students', 'GPA 3.5+', '20/21', '2025-06-30', 100000, 'Active'),
  ('Alumni Scholarship',     'Funded by alumni network',   'GPA 3.0+', '21/22', '2025-08-15', 75000,  'Active'),
  ('Need-Based Grant',       'For financially disadvantaged students', 'Income < LKR 50,000/month', '20/21', '2025-07-01', 50000, 'Active');

insert into applications (scholarship_title, student_name, registration_number, batch, email, phone, department, current_year, gpa, monthly_income, dependents, status) values
  ('Merit Fund Scholarship', 'Samith Perera',  'CG/2021/025', '20/21', 'samith@student.pdn.ac.lk',  '+94 71 001 0001', 'Computer Engineering', '3rd Year', 3.75, 35000, 4, 'Pending'),
  ('Merit Fund Scholarship', 'Anjana Perera',  'CG/2021/011', '20/21', 'anjana@student.pdn.ac.lk',  '+94 71 002 0002', 'Computer Engineering', '3rd Year', 3.80, 28000, 3, 'Approved'),
  ('Alumni Scholarship',     'Nimal Fernando', 'CG/2021/033', '20/21', 'nimal@student.pdn.ac.lk',   '+94 71 003 0003', 'Computer Engineering', '3rd Year', 3.70, 42000, 5, 'Pending'),
  ('Need-Based Grant',       'Dilani Silva',   'CG/2021/018', '20/21', 'dilani@student.pdn.ac.lk',  '+94 71 004 0004', 'Computer Engineering', '3rd Year', 3.65, 22000, 6, 'Rejected');

insert into donor_scholarship_requests (donor_name, scholarship_title, description, funding_amount, eligibility_criteria, eligible_batch, application_deadline, status) values
  ('Neil Fernando',     'Engineering Excellence Award', 'For top engineering students', 200000, 'GPA 3.7+, final year',  '21/22', '2025-09-01', 'Pending'),
  ('Anuki Wijesinghe',  'Women in STEM Grant',          'Supporting female students',   150000, 'Female students, GPA 3.0+', '21/22', '2025-10-01', 'Pending');

insert into announcements (title, audience, content, publish_date, status) values
  ('Scholarship Applications Open', 'Students',  'Applications for the Merit Fund Scholarship are now open. Deadline: June 30.', '2025-04-01', 'Published'),
  ('New Donor Partner Onboarded',   'All Users', 'We welcome Foundation XYZ as our newest scholarship partner.', '2025-03-15', 'Published'),
  ('System Maintenance Notice',     'All Users', 'The system will be down for maintenance on April 5 from 2–4 AM.', '2025-04-04', 'Draft');

insert into issues (title, description, reported_by, category, status) values
  ('Cannot upload transcript', 'File upload fails for PDFs over 5MB', 'Samith Perera',  'Document Issue',      'Open'),
  ('Wrong scholarship deadline shown', 'Alumni scholarship shows wrong date', 'Nimal Fernando', 'Scholarship Issue', 'In Progress'),
  ('Application stuck in pending',     'My application has been pending for 3 weeks', 'Dilani Silva', 'Application Inquiry', 'Resolved');
