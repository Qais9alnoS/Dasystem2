# تعليمات تحديث قاعدة البيانات - Migration Instructions

## التحديثات المطلوبة:

تم إضافة ميزة الفصل بين الفترة الصباحية والمسائية في:
- إدارة أيام العطلة
- حضور الطلاب
- الإجراءات السريعة

## خطوات التنفيذ:

### 1. تشغيل SQL Migration Script

قم بتنفيذ الملف `database_migration_add_session_type.sql` على قاعدة البيانات:

```bash
# إذا كنت تستخدم PostgreSQL
psql -U your_username -d your_database_name -f database_migration_add_session_type.sql

# أو من داخل psql
\i database_migration_add_session_type.sql
```

### 2. إعادة تشغيل Backend

بعد تنفيذ التحديثات:

```bash
cd "DAS Backend"
# إيقاف الخادم الحالي (Ctrl+C)
# ثم إعادة التشغيل
uvicorn app.main:app --reload
```

### 3. إعادة تشغيل Frontend

```bash
cd "DAS Frontend"
npm run dev
```

## ما تم تغييره:

### Backend Changes:
1. ✅ إضافة `session_type` إلى `Holiday` model
2. ✅ إضافة `session_type` إلى `User` model
3. ✅ تحديث `HolidayCreate` و `HolidayResponse` schemas
4. ✅ تحديث API endpoints لدعم فلتر `session_type`

### Frontend Changes:
1. ✅ تحديث `DailyPage` لتحديد الفترة بناءً على دور المستخدم
2. ✅ إضافة زر اختيار الفترة للمدير فقط
3. ✅ تحديث `HolidayManagement` لإرسال واستقبال `session_type`
4. ✅ إصلاح مشكلة عدم تحديث لون العطلة بعد الإضافة
5. ✅ تحسين UI/UX مع Dark Mode support

## ملاحظات مهمة:

- **المدير (director/admin)**: يمكنه رؤية وإدارة كلا الفترتين
- **المشرف الصباحي**: يرى فقط بيانات الفترة الصباحية
- **المشرف المسائي**: يرى فقط بيانات الفترة المسائية
- **العطل الأسبوعية**: الجمعة والسبت (تم إصلاحها من الأربعاء والخميس)

## في حالة حدوث مشاكل:

إذا واجهت مشاكل في قاعدة البيانات، يمكنك التراجع عن التغييرات:

```sql
-- Rollback (في حالة الحاجة فقط)
ALTER TABLE holidays DROP COLUMN IF EXISTS session_type;
ALTER TABLE users DROP COLUMN IF EXISTS session_type;
```

ثم أعد تشغيل migration script مرة أخرى.
