-- Migration script to add session_type to holidays and users tables
-- تحديث قاعدة البيانات لإضافة session_type

-- إضافة session_type إلى جدول holidays
ALTER TABLE holidays 
ADD COLUMN session_type VARCHAR(10) NOT NULL DEFAULT 'morning';

-- إزالة unique constraint من holiday_date لأن نفس التاريخ يمكن أن يكون عطلة للصباحي والمسائي
-- ALTER TABLE holidays DROP CONSTRAINT IF EXISTS holidays_holiday_date_key;

-- إضافة session_type إلى جدول users
ALTER TABLE users 
ADD COLUMN session_type VARCHAR(10);

-- تحديث البيانات الموجودة
-- جميع العطل الموجودة تكون صباحية افتراضياً
UPDATE holidays SET session_type = 'morning' WHERE session_type IS NULL;

-- تحديث المستخدمين - يمكن تعديل هذا حسب احتياجاتك
-- مثال: جعل المستخدمين الذين دورهم morning_school فترتهم صباحية
UPDATE users SET session_type = 'morning' WHERE role = 'morning_school';
UPDATE users SET session_type = 'evening' WHERE role = 'evening_school';
-- المدير والمالية لا يحتاجون session_type (NULL)
UPDATE users SET session_type = NULL WHERE role IN ('director', 'finance', 'admin');

-- إنشاء index للبحث الأسرع
CREATE INDEX IF NOT EXISTS idx_holidays_session_date ON holidays(session_type, holiday_date);
CREATE INDEX IF NOT EXISTS idx_users_session_type ON users(session_type);

-- تعليق
COMMENT ON COLUMN holidays.session_type IS 'morning or evening - للفصل بين فترة الصباح والمساء';
COMMENT ON COLUMN users.session_type IS 'morning or evening - للمشرفين فقط، المدير والإداريين NULL';
