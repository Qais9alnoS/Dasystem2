-- Migration: Add quiz grades and quizzes_count
-- Date: 2025-11-28
-- Description: Add four quiz grade columns to student_academics and quizzes_count to classes

-- 1. Add quizzes_count column to classes table
ALTER TABLE classes 
ADD COLUMN quizzes_count INTEGER NOT NULL DEFAULT 2;

-- 2. Add quiz grade columns to student_academics table
ALTER TABLE student_academics 
ADD COLUMN first_quiz_grade NUMERIC(5,2);

ALTER TABLE student_academics 
ADD COLUMN second_quiz_grade NUMERIC(5,2);

ALTER TABLE student_academics 
ADD COLUMN third_quiz_grade NUMERIC(5,2);

ALTER TABLE student_academics 
ADD COLUMN fourth_quiz_grade NUMERIC(5,2);

-- 3. Drop old exam grade columns (optional - uncomment if you want to remove them)
-- ALTER TABLE student_academics DROP COLUMN IF EXISTS first_exam_grades;
-- ALTER TABLE student_academics DROP COLUMN IF EXISTS second_exam_grades;

-- 4. Comment on new columns
COMMENT ON COLUMN classes.quizzes_count IS 'Number of quizzes for this class (2 or 4)';
COMMENT ON COLUMN student_academics.first_quiz_grade IS 'المذاكرة الأولى';
COMMENT ON COLUMN student_academics.second_quiz_grade IS 'المذاكرة الثانية';
COMMENT ON COLUMN student_academics.third_quiz_grade IS 'المذاكرة الثالثة';
COMMENT ON COLUMN student_academics.fourth_quiz_grade IS 'المذاكرة الرابعة';
