import { z } from 'zod';

// Common validation patterns
const arabicNamePattern = /^[\u0600-\u06FF\s]+$/;
const englishNamePattern = /^[a-zA-Z\s]+$/;
const phonePattern = /^(\+964|0)[0-9]{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared field validations
const requiredString = (fieldName: string) =>
    z.string().min(1, `${fieldName} مطلوب`);

const optionalString = z.string().optional();

const arabicName = (fieldName: string) =>
    z.string()
        .min(2, `${fieldName} يجب أن يكون على الأقل 2 أحرف`)
        .max(50, `${fieldName} يجب أن يكون أقل من 50 حرف`)
        .regex(arabicNamePattern, `${fieldName} يجب أن يحتوي على أحرف عربية فقط`);

const englishName = (fieldName: string) =>
    z.string()
        .min(2, `${fieldName} must be at least 2 characters`)
        .max(50, `${fieldName} must be less than 50 characters`)
        .regex(englishNamePattern, `${fieldName} must contain English letters only`);

const phoneNumber = z.string()
    .regex(phonePattern, 'رقم الهاتف غير صحيح (مثال: +9647701234567 أو 07701234567)');

const emailAddress = z.string()
    .email('البريد الإلكتروني غير صحيح');

const positiveNumber = (fieldName: string) =>
    z.number()
        .positive(`${fieldName} يجب أن يكون رقم موجب`)
        .int(`${fieldName} يجب أن يكون رقم صحيح`);

const currency = (fieldName: string) =>
    z.number()
        .min(0, `${fieldName} لا يمكن أن يكون سالب`)
        .multipleOf(0.01, `${fieldName} يجب أن يكون بصيغة صحيحة للعملة`);

const percentage = (fieldName: string) =>
    z.number()
        .min(0, `${fieldName} لا يمكن أن يكون أقل من 0%`)
        .max(100, `${fieldName} لا يمكن أن يكون أكثر من 100%`);

const dateString = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ يجب أن يكون بصيغة YYYY-MM-DD');

const futureDate = z.string()
    .refine((date) => new Date(date) > new Date(), 'التاريخ يجب أن يكون في المستقبل');

const pastDate = z.string()
    .refine((date) => new Date(date) < new Date(), 'التاريخ يجب أن يكون في الماضي');

// Student validation schemas
export const studentPersonalInfoSchema = z.object({
    // Basic Info
    name: englishName('الاسم بالإنجليزية'),
    nameAr: arabicName('الاسم بالعربية'),
    nationalId: z.string()
        .length(10, 'رقم الهوية يجب أن يكون 10 أرقام')
        .regex(/^\d{10}$/, 'رقم الهوية يجب أن يحتوي على أرقام فقط'),
    birthDate: pastDate,
    gender: z.enum(['male', 'female'], {
        required_error: 'الجنس مطلوب',
        invalid_type_error: 'الجنس يجب أن يكون ذكر أو أنثى'
    }),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),

    // Academic Info
    grade: requiredString('الصف'),
    section: requiredString('الشعبة'),
    academicYear: requiredString('السنة الدراسية'),
    enrollmentDate: dateString,
    studentNumber: z.string()
        .min(3, 'رقم الطالب يجب أن يكون على الأقل 3 أرقام')
        .max(10, 'رقم الطالب يجب أن يكون أقل من 10 أرقام'),

    // Contact Info
    address: requiredString('العنوان'),
    phone: phoneNumber.optional(),
    email: emailAddress.optional(),

    // Special Needs
    hasSpecialNeeds: z.boolean().default(false),
    specialNeedsDescription: z.string().optional(),
    medicalConditions: z.string().optional(),
    allergies: z.string().optional(),

    // Emergency Contact
    emergencyContactName: arabicName('اسم جهة الاتصال في الطوارئ'),
    emergencyContactPhone: phoneNumber,
    emergencyContactRelation: requiredString('صلة القرابة'),
});

export const studentFamilyInfoSchema = z.object({
    // Father Info
    fatherName: arabicName('اسم الأب'),
    fatherOccupation: optionalString,
    fatherPhone: phoneNumber.optional(),
    fatherEmail: emailAddress.optional(),
    fatherEducation: optionalString,

    // Mother Info
    motherName: arabicName('اسم الأم'),
    motherOccupation: optionalString,
    motherPhone: phoneNumber.optional(),
    motherEmail: emailAddress.optional(),
    motherEducation: optionalString,

    // Family Info
    familyIncome: z.enum(['low', 'medium', 'high']).optional(),
    numberOfSiblings: z.number().min(0).max(20).optional(),
    guardianName: optionalString,
    guardianPhone: phoneNumber.optional(),
    guardianRelation: optionalString,
});

export const studentFinancialSchema = z.object({
    tuitionFee: currency('الرسوم الدراسية'),
    transportationFee: currency('رسوم النقل').optional(),
    booksFee: currency('رسوم الكتب').optional(),
    activitiesFee: currency('رسوم الأنشطة').optional(),

    // Discounts
    hasDiscount: z.boolean().default(false),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountAmount: z.number().optional(),
    discountReason: optionalString,

    // Payment Info
    paymentMethod: z.enum(['cash', 'bank_transfer', 'check']).optional(),
    installmentPlan: z.boolean().default(false),
    numberOfInstallments: z.number().min(1).max(12).optional(),
});

export const studentAcademicSchema = z.object({
    previousSchool: optionalString,
    previousGrade: optionalString,
    transferReason: optionalString,

    // Current Academic Status
    currentGPA: percentage('المعدل الحالي').optional(),
    behaviorGrade: z.enum(['excellent', 'very_good', 'good', 'fair', 'poor']).optional(),
    attendanceRate: percentage('معدل الحضور').optional(),

    // Academic Goals
    academicGoals: optionalString,
    careerInterests: optionalString,
    strengths: optionalString,
    weaknesses: optionalString,
});

// Teacher validation schemas
export const teacherPersonalInfoSchema = z.object({
    // Basic Info
    name: englishName('الاسم بالإنجليزية'),
    nameAr: arabicName('الاسم بالعربية'),
    nationalId: z.string()
        .length(10, 'رقم الهوية يجب أن يكون 10 أرقام')
        .regex(/^\d{10}$/, 'رقم الهوية يجب أن يحتوي على أرقام فقط'),
    birthDate: pastDate,
    gender: z.enum(['male', 'female']),

    // Contact Info
    address: requiredString('العنوان'),
    phone: phoneNumber,
    email: emailAddress,
    emergencyContact: phoneNumber,

    // Employment Info
    employeeId: requiredString('رقم الموظف'),
    hireDate: dateString,
    contractType: z.enum(['permanent', 'temporary', 'part_time']),
    salary: currency('الراتب'),

    // Professional Info
    education: requiredString('المؤهل العلمي'),
    specialization: requiredString('التخصص'),
    experience: positiveNumber('سنوات الخبرة'),
    certifications: z.array(z.string()).optional(),
});

export const teacherAcademicSchema = z.object({
    subjects: z.array(z.string()).min(1, 'يجب اختيار مادة واحدة على الأقل'),
    grades: z.array(z.string()).min(1, 'يجب اختيار صف واحد على الأقل'),
    maxHoursPerWeek: positiveNumber('أقصى عدد ساعات أسبوعيا'),
    availableDays: z.array(z.string()).min(1, 'يجب اختيار يوم واحد على الأقل'),
    preferredSchedule: z.enum(['morning', 'evening', 'both']).optional(),
});

// Financial validation schemas
export const transactionSchema = z.object({
    type: z.enum(['income', 'expense'], {
        required_error: 'نوع المعاملة مطلوب',
        invalid_type_error: 'نوع المعاملة يجب أن يكون دخل أو مصروف'
    }),
    category: requiredString('الفئة'),
    amount: currency('المبلغ'),
    description: requiredString('الوصف'),
    date: dateString,
    paymentMethod: z.enum(['cash', 'bank_transfer', 'check']),
    reference: optionalString,
    notes: optionalString,
});

export const budgetSchema = z.object({
    name: requiredString('اسم الميزانية'),
    academicYear: requiredString('السنة الدراسية'),
    totalBudget: currency('إجمالي الميزانية'),
    categories: z.array(z.object({
        name: requiredString('اسم الفئة'),
        allocation: currency('المخصص'),
        description: optionalString,
    })).min(1, 'يجب إضافة فئة واحدة على الأقل'),
});

// Activity validation schemas
export const activitySchema = z.object({
    name: requiredString('اسم النشاط'),
    nameAr: arabicName('اسم النشاط بالعربية'),
    type: z.enum(['sports', 'cultural', 'educational', 'social', 'religious']),
    description: requiredString('وصف النشاط'),

    // Scheduling
    startDate: dateString,
    endDate: dateString,
    duration: positiveNumber('مدة النشاط (بالساعات)'),
    location: requiredString('المكان'),

    // Participation
    maxParticipants: positiveNumber('أقصى عدد مشاركين').optional(),
    minAge: z.number().min(5).max(18).optional(),
    maxAge: z.number().min(5).max(18).optional(),
    targetGrades: z.array(z.string()).optional(),

    // Financial
    cost: currency('التكلفة').optional(),
    registrationFee: currency('رسم التسجيل').optional(),

    // Requirements
    requirements: optionalString,
    equipment: optionalString,
}).refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
        message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية',
        path: ['endDate'],
    }
).refine(
    (data) => !data.maxAge || !data.minAge || data.maxAge >= data.minAge,
    {
        message: 'العمر الأقصى يجب أن يكون أكبر من أو يساوي العمر الأدنى',
        path: ['maxAge'],
    }
);

// Authentication validation schemas
export const loginSchema = z.object({
    username: z.string()
        .min(3, 'اسم المستخدم يجب أن يكون على الأقل 3 أحرف')
        .max(50, 'اسم المستخدم يجب أن يكون أقل من 50 حرف'),
    password: z.string()
        .min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف')
        .max(100, 'كلمة المرور طويلة جداً'),
    role: z.enum(['director', 'finance', 'morning_school', 'evening_school'], {
        required_error: 'الدور مطلوب',
        invalid_type_error: 'الدور غير صحيح'
    }),
    rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z.string()
        .min(8, 'كلمة المرور الجديدة يجب أن تكون على الأقل 8 أحرف')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم'),
    confirmPassword: z.string(),
}).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
        message: 'كلمة المرور غير متطابقة',
        path: ['confirmPassword'],
    }
);

// Schedule validation schemas
export const scheduleConstraintSchema = z.object({
    type: z.enum(['forbidden', 'required', 'max_consecutive', 'min_break']),
    teacherId: optionalString,
    subjectId: optionalString,
    gradeId: optionalString,
    day: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']).optional(),
    period: z.number().min(1).max(8).optional(),
    maxHours: positiveNumber('أقصى عدد ساعات').optional(),
    description: requiredString('الوصف'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// Search validation schemas
export const searchSchema = z.object({
    query: z.string()
        .min(3, 'البحث يجب أن يكون على الأقل 3 أحرف')
        .max(50, 'البحث يجب أن يكون أقل من 50 حرف'),
    type: z.enum(['all', 'students', 'teachers', 'activities']).default('all'),
    filters: z.object({
        grade: optionalString,
        section: optionalString,
        status: optionalString,
    }).optional(),
});

// Settings validation schemas
export const schoolInfoSchema = z.object({
    name: arabicName('اسم المدرسة'),
    nameEn: englishName('School Name'),
    address: requiredString('العنوان'),
    phone: phoneNumber,
    email: emailAddress,
    website: z.string().url('الموقع الإلكتروني غير صحيح').optional(),

    // Administrative Info
    directorName: arabicName('اسم المدير'),
    establishedYear: z.number()
        .min(1900, 'سنة التأسيس يجب أن تكون بعد 1900')
        .max(new Date().getFullYear(), 'سنة التأسيس لا يمكن أن تكون في المستقبل'),

    // Academic Info
    grades: z.array(z.string()).min(1, 'يجب إضافة صف واحد على الأقل'),
    totalCapacity: positiveNumber('السعة الإجمالية'),
    currentEnrollment: z.number().min(0, 'عدد الطلاب المسجلين لا يمكن أن يكون سالب'),

    // Settings
    academicYearStart: z.number().min(1).max(12),
    academicYearEnd: z.number().min(1).max(12),
    workingDays: z.array(z.string()).min(3, 'يجب اختيار 3 أيام عمل على الأقل'),
    periodsPerDay: z.number().min(4).max(10),
});

// Combined schemas for complex forms
export const completeStudentSchema = z.object({
    personal: studentPersonalInfoSchema,
    family: studentFamilyInfoSchema,
    financial: studentFinancialSchema,
    academic: studentAcademicSchema,
});

export const completeTeacherSchema = z.object({
    personal: teacherPersonalInfoSchema,
    academic: teacherAcademicSchema,
});

// Utility functions for validation
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: z.ZodError['errors'];
} => {
    try {
        const validData = schema.parse(data);
        return { success: true, data: validData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, errors: error.errors };
        }
        return { success: false, errors: [{ path: [], message: 'خطأ في التحقق من البيانات', code: 'custom' }] };
    }
};

export const getErrorMessages = (errors: z.ZodError['errors']): Record<string, string> => {
    const errorMessages: Record<string, string> = {};
    errors.forEach((error) => {
        const path = error.path.join('.');
        errorMessages[path] = error.message;
    });
    return errorMessages;
};

// Export all schemas for easy access
export const validationSchemas = {
    student: {
        personal: studentPersonalInfoSchema,
        family: studentFamilyInfoSchema,
        financial: studentFinancialSchema,
        academic: studentAcademicSchema,
        complete: completeStudentSchema,
    },
    teacher: {
        personal: teacherPersonalInfoSchema,
        academic: teacherAcademicSchema,
        complete: completeTeacherSchema,
    },
    financial: {
        transaction: transactionSchema,
        budget: budgetSchema,
    },
    activity: activitySchema,
    auth: {
        login: loginSchema,
        changePassword: changePasswordSchema,
    },
    schedule: {
        constraint: scheduleConstraintSchema,
    },
    search: searchSchema,
    settings: {
        schoolInfo: schoolInfoSchema,
    },
};