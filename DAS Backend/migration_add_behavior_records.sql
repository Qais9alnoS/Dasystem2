-- Migration: Add student_behavior_records table
-- Date: 2025-11-28
-- Description: Creates table for tracking student behavior (مشاغبة، مشاركة مميزة، بطاقة شكر، ملاحظة، إنذار، استدعاء ولي أمر، فصل)

CREATE TABLE IF NOT EXISTS student_behavior_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    academic_year_id INTEGER NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- مشاغبة، مشاركة_مميزة، بطاقة_شكر، ملاحظة، إنذار، استدعاء_ولي_أمر، فصل
    record_date DATE NOT NULL,
    description TEXT,
    recorded_by INTEGER, -- المستخدم الذي سجل الحدث
    severity VARCHAR(20), -- low, medium, high (للإنذارات والفصل)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_behavior_student ON student_behavior_records(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_academic_year ON student_behavior_records(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_behavior_date ON student_behavior_records(record_date);
CREATE INDEX IF NOT EXISTS idx_behavior_type ON student_behavior_records(record_type);
