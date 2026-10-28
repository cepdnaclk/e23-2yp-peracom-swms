CREATE TABLE IF NOT EXISTS scholarship_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scholarship_id UUID NOT NULL,
    student_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    admin_id UUID,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'sent', 'failed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    approved_by UUID,
    sent_by UUID,
    rejection_reason TEXT,
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notification_scholarship
        FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_donor
        FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_admin
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_notification_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scholarship_notifications_status
    ON scholarship_notifications(status);

CREATE INDEX IF NOT EXISTS idx_scholarship_notifications_scholarship
    ON scholarship_notifications(scholarship_id);
