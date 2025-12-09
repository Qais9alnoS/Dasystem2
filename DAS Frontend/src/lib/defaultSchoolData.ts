// Default School Configuration Data

export interface SubjectTemplate {
  name: string;
  weekly_hours: number;
}

export interface GradeTemplate {
  grade_number: number;
  grade_level: 'primary' | 'intermediate' | 'secondary';
  default_section_count: number;
  max_students_per_section?: number;
  subjects: SubjectTemplate[];
}

// Default subjects for each grade
export const defaultSubjects: Record<string, SubjectTemplate[]> = {
  // الصف الأول والثاني الأساسي
  'primary-1': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 9 },
    { name: 'اللغة الإنكليزية', weekly_hours: 2 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 1 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'التربية الموسيقية', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية', weekly_hours: 1 },
    { name: 'الأنشطة', weekly_hours: 1 },
    { name: 'مادة اختيارية', weekly_hours: 5 },
  ],
  'primary-2': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 9 },
    { name: 'اللغة الإنكليزية', weekly_hours: 2 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 1 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'التربية الموسيقية', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية', weekly_hours: 1 },
    { name: 'الأنشطة', weekly_hours: 1 },
    { name: 'مادة اختيارية', weekly_hours: 5 },
  ],
  // الصف الثالث والرابع الأساسي
  'primary-3': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 8 },
    { name: 'اللغة الإنكليزية', weekly_hours: 3 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 1 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'التربية الموسيقية', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية', weekly_hours: 1 },
    { name: 'الأنشطة', weekly_hours: 1 },
    { name: 'مادة اختيارية', weekly_hours: 5 },
  ],
  'primary-4': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 8 },
    { name: 'اللغة الإنكليزية', weekly_hours: 3 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 1 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'التربية الموسيقية', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية', weekly_hours: 1 },
    { name: 'الأنشطة', weekly_hours: 1 },
    { name: 'مادة اختيارية', weekly_hours: 5 },
  ],
  // الصف الخامس والسادس الأساسي
  'primary-5': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 7 },
    { name: 'اللغة الإنكليزية', weekly_hours: 3 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 2 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'التربية الموسيقية', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية', weekly_hours: 1 },
    { name: 'الأنشطة', weekly_hours: 1 },
    { name: 'مادة اختيارية', weekly_hours: 5 },
  ],
  'primary-6': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 7 },
    { name: 'اللغة الإنكليزية', weekly_hours: 3 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 2 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'التربية الموسيقية', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية', weekly_hours: 1 },
    { name: 'الأنشطة', weekly_hours: 1 },
    { name: 'مادة اختيارية', weekly_hours: 5 },
  ],
  // الصف السابع
  'intermediate-1': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 6 },
    { name: 'اللغة الإنكليزية', weekly_hours: 3 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 4 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'الفيزياء والكيمياء', weekly_hours: 2 },
    { name: 'التكنولوجيا (صيانة حاسوب)', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية والصحية', weekly_hours: 1 },
    { name: 'نشاط', weekly_hours: 1 },
    { name: 'لغة فرنسية', weekly_hours: 2 },
  ],
  // الصف الثامن
  'intermediate-2': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 6 },
    { name: 'اللغة الإنكليزية', weekly_hours: 3 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 4 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'الفيزياء والكيمياء', weekly_hours: 2 },
    { name: 'التكنولوجيا (صيانة حاسوب)', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية والصحية', weekly_hours: 1 },
    { name: 'نشاط', weekly_hours: 1 },
    { name: 'لغة فرنسية', weekly_hours: 2 },
  ],
  // الصف التاسع
  'intermediate-3': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 6 },
    { name: 'اللغة الإنكليزية', weekly_hours: 4 },
    { name: 'الرياضيات', weekly_hours: 5 },
    { name: 'الدراسات الاجتماعية', weekly_hours: 4 },
    { name: 'علم الأحياء والعلوم العامة', weekly_hours: 2 },
    { name: 'الفيزياء والكيمياء', weekly_hours: 2 },
    { name: 'التكنولوجيا (صيانة حاسوب)', weekly_hours: 1 },
    { name: 'التربية الفنية', weekly_hours: 1 },
    { name: 'التربية الرياضية والصحية', weekly_hours: 1 },
    { name: 'لغة فرنسية', weekly_hours: 2 },
  ],
  // الصف الأول الثانوي
  'secondary-1': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 4 },
    { name: 'اللغة الإنكليزية', weekly_hours: 4 },
    { name: 'اللغة الفرنسية', weekly_hours: 2 },
    { name: 'الرياضيات', weekly_hours: 6 },
    { name: 'الفيزياء', weekly_hours: 3 },
    { name: 'الكيمياء', weekly_hours: 2 },
    { name: 'علم الأحياء والأرض', weekly_hours: 3 },
    { name: 'التربية الرياضية', weekly_hours: 2 },
    { name: 'المعلوماتية', weekly_hours: 1 },
    { name: 'الفلسفة', weekly_hours: 1 },
  ],
  // الصف الثاني الثانوي
  'secondary-2': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 4 },
    { name: 'اللغة الإنكليزية', weekly_hours: 4 },
    { name: 'اللغة الفرنسية', weekly_hours: 2 },
    { name: 'الرياضيات', weekly_hours: 6 },
    { name: 'الفيزياء', weekly_hours: 4 },
    { name: 'الكيمياء', weekly_hours: 2 },
    { name: 'علم الأحياء والأرض', weekly_hours: 3 },
    { name: 'التربية الرياضية', weekly_hours: 1 },
    { name: 'المعلوماتية', weekly_hours: 1 },
    { name: 'الفلسفة', weekly_hours: 1 },
  ],
  // الصف الثالث الثانوي - علمي
  'secondary-3-science': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 4 },
    { name: 'اللغة الإنكليزية', weekly_hours: 4 },
    { name: 'اللغة الفرنسية', weekly_hours: 2 },
    { name: 'الرياضيات', weekly_hours: 8 },
    { name: 'الفيزياء', weekly_hours: 5 },
    { name: 'الكيمياء', weekly_hours: 2 },
    { name: 'علم الأحياء والأرض', weekly_hours: 3 },
  ],
  // الصف الثالث الثانوي - أدبي
  'secondary-3-literary': [
    { name: 'التربية الدينية', weekly_hours: 2 },
    { name: 'اللغة العربية', weekly_hours: 8 },
    { name: 'اللغة الإنكليزية', weekly_hours: 5 },
    { name: 'الفلسفة', weekly_hours: 5 },
    { name: 'التاريخ', weekly_hours: 3 },
    { name: 'الجغرافيا', weekly_hours: 3 },
    { name: 'المعلوماتية', weekly_hours: 1 },
    { name: 'التربية الرياضية والصحية', weekly_hours: 1 },
    { name: 'لغة فرنسية', weekly_hours: 2 },
  ],
};

// Default grade templates
export const defaultGradeTemplates: GradeTemplate[] = [
  // Primary (ابتدائي) - شعبة واحدة لكل صف
  { grade_number: 1, grade_level: 'primary', default_section_count: 1, max_students_per_section: 30, subjects: defaultSubjects['primary-1'] },
  { grade_number: 2, grade_level: 'primary', default_section_count: 1, max_students_per_section: 30, subjects: defaultSubjects['primary-2'] },
  { grade_number: 3, grade_level: 'primary', default_section_count: 1, max_students_per_section: 30, subjects: defaultSubjects['primary-3'] },
  { grade_number: 4, grade_level: 'primary', default_section_count: 1, max_students_per_section: 30, subjects: defaultSubjects['primary-4'] },
  { grade_number: 5, grade_level: 'primary', default_section_count: 1, max_students_per_section: 30, subjects: defaultSubjects['primary-5'] },
  { grade_number: 6, grade_level: 'primary', default_section_count: 1, max_students_per_section: 30, subjects: defaultSubjects['primary-6'] },
  // Intermediate (إعدادي) - شعبتين لكل صف
  { grade_number: 1, grade_level: 'intermediate', default_section_count: 2, max_students_per_section: 30, subjects: defaultSubjects['intermediate-1'] },
  { grade_number: 2, grade_level: 'intermediate', default_section_count: 2, max_students_per_section: 30, subjects: defaultSubjects['intermediate-2'] },
  { grade_number: 3, grade_level: 'intermediate', default_section_count: 2, max_students_per_section: 30, subjects: defaultSubjects['intermediate-3'] },
  // Secondary (ثانوي) - شعبتين لكل صف
  { grade_number: 1, grade_level: 'secondary', default_section_count: 2, max_students_per_section: 30, subjects: defaultSubjects['secondary-1'] },
  { grade_number: 2, grade_level: 'secondary', default_section_count: 2, max_students_per_section: 30, subjects: defaultSubjects['secondary-2'] },
  // بكالوريا - 3 شعب (2 علمي + 1 أدبي)
  { grade_number: 3, grade_level: 'secondary', default_section_count: 3, max_students_per_section: 30, subjects: defaultSubjects['secondary-3-science'] },
];

export const getGradeLabel = (grade_level: string, grade_number: number): string => {
  const levelLabels = {
    primary: 'ابتدائي',
    intermediate: 'إعدادي',
    secondary: 'ثانوي',
  };
  return `${levelLabels[grade_level as keyof typeof levelLabels]} - الصف ${grade_number}`;
};

export const getSectionLabel = (index: number): string => {
  return String(index + 1); // 1, 2, 3, ...
};

