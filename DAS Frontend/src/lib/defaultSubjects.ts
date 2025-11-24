// Default subjects configuration based on Syrian education system
// Source: tables.md

export interface SubjectConfig {
  name: string;
  weeklyHours: number;
  isMandatory: boolean;
}

export interface GradeSubjects {
  gradeName: string;
  gradeOrder: number;
  level: string;
  subjects: SubjectConfig[];
  totalHours: number;
}

export const DEFAULT_SUBJECTS: GradeSubjects[] = [
  // Primary Level (الابتدائي)
  {
    gradeName: "الصف الأول الابتدائي",
    gradeOrder: 1,
    level: "ابتدائي",
    totalHours: 20,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 3, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 6, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 2, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "تربية موسيقية", weeklyHours: 1, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف الثاني الابتدائي",
    gradeOrder: 2,
    level: "ابتدائي",
    totalHours: 20,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 3, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 6, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 2, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "تربية موسيقية", weeklyHours: 1, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف الثالث الابتدائي",
    gradeOrder: 3,
    level: "ابتدائي",
    totalHours: 20,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 3, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 6, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "علوم", weeklyHours: 2, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 1, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف الرابع الابتدائي",
    gradeOrder: 4,
    level: "ابتدائي",
    totalHours: 22,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 3, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 6, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "علوم", weeklyHours: 2, isMandatory: true },
      { name: "اجتماعيات", weeklyHours: 2, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 1, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف الخامس الابتدائي",
    gradeOrder: 5,
    level: "ابتدائي",
    totalHours: 27,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 3, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 6, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "علوم", weeklyHours: 3, isMandatory: true },
      { name: "اجتماعيات", weeklyHours: 3, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 3, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 1, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف السادس الابتدائي",
    gradeOrder: 6,
    level: "ابتدائي",
    totalHours: 28,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 3, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 6, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "علوم", weeklyHours: 3, isMandatory: true },
      { name: "اجتماعيات", weeklyHours: 3, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 3, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 1, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "حاسوب", weeklyHours: 1, isMandatory: true },
    ]
  },

  // Preparatory Level (الإعدادي)
  {
    gradeName: "الصف السابع",
    gradeOrder: 7,
    level: "اعدادي",
    totalHours: 30,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 2, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 5, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "علوم", weeklyHours: 3, isMandatory: true },
      { name: "اجتماعيات", weeklyHours: 3, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 4, isMandatory: true },
      { name: "لغة فرنسية", weeklyHours: 3, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 1, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "حاسوب", weeklyHours: 1, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف الثامن",
    gradeOrder: 8,
    level: "اعدادي",
    totalHours: 33,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 2, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 5, isMandatory: true },
      { name: "رياضيات", weeklyHours: 4, isMandatory: true },
      { name: "فيزياء", weeklyHours: 2, isMandatory: true },
      { name: "كيمياء", weeklyHours: 2, isMandatory: true },
      { name: "أحياء", weeklyHours: 2, isMandatory: true },
      { name: "اجتماعيات", weeklyHours: 3, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 4, isMandatory: true },
      { name: "لغة فرنسية", weeklyHours: 3, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 1, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "حاسوب", weeklyHours: 1, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف التاسع",
    gradeOrder: 9,
    level: "اعدادي",
    totalHours: 38,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 2, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 5, isMandatory: true },
      { name: "رياضيات", weeklyHours: 5, isMandatory: true },
      { name: "فيزياء", weeklyHours: 3, isMandatory: true },
      { name: "كيمياء", weeklyHours: 3, isMandatory: true },
      { name: "أحياء", weeklyHours: 3, isMandatory: true },
      { name: "تاريخ", weeklyHours: 2, isMandatory: true },
      { name: "جغرافيا", weeklyHours: 2, isMandatory: true },
      { name: "تربية وطنية", weeklyHours: 1, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 4, isMandatory: true },
      { name: "لغة فرنسية", weeklyHours: 3, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "تربية فنية", weeklyHours: 1, isMandatory: true },
    ]
  },

  // Secondary Level (الثانوي)
  {
    gradeName: "الصف العاشر",
    gradeOrder: 10,
    level: "ثانوي",
    totalHours: 36,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 2, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 1, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 4, isMandatory: true },
      { name: "رياضيات", weeklyHours: 5, isMandatory: true },
      { name: "فيزياء", weeklyHours: 3, isMandatory: true },
      { name: "كيمياء", weeklyHours: 3, isMandatory: true },
      { name: "أحياء", weeklyHours: 3, isMandatory: true },
      { name: "تاريخ", weeklyHours: 2, isMandatory: true },
      { name: "جغرافيا", weeklyHours: 2, isMandatory: true },
      { name: "تربية وطنية", weeklyHours: 1, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 4, isMandatory: true },
      { name: "لغة فرنسية", weeklyHours: 3, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "فلسفة", weeklyHours: 1, isMandatory: true },
    ]
  },
  {
    gradeName: "الصف الحادي عشر",
    gradeOrder: 11,
    level: "ثانوي",
    totalHours: 39,
    subjects: [
      { name: "قرآن كريم", weeklyHours: 2, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 1, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 4, isMandatory: true },
      { name: "رياضيات", weeklyHours: 5, isMandatory: true },
      { name: "فيزياء", weeklyHours: 4, isMandatory: true },
      { name: "كيمياء", weeklyHours: 4, isMandatory: true },
      { name: "أحياء", weeklyHours: 3, isMandatory: true },
      { name: "تاريخ", weeklyHours: 2, isMandatory: true },
      { name: "جغرافيا", weeklyHours: 2, isMandatory: true },
      { name: "تربية وطنية", weeklyHours: 1, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 4, isMandatory: true },
      { name: "لغة فرنسية", weeklyHours: 3, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 2, isMandatory: true },
      { name: "فلسفة", weeklyHours: 2, isMandatory: true },
    ]
  },

  // Baccalaureate Level (البكالوريا) - Scientific Track
  {
    gradeName: "الصف الثالث ثانوي",
    gradeOrder: 12,
    level: "بكالوريا",
    totalHours: 35, // Scientific track default
    subjects: [
      { name: "قرآن كريم", weeklyHours: 1, isMandatory: true },
      { name: "تربية إسلامية", weeklyHours: 1, isMandatory: true },
      { name: "لغة عربية", weeklyHours: 4, isMandatory: true },
      { name: "رياضيات", weeklyHours: 6, isMandatory: true },
      { name: "فيزياء", weeklyHours: 5, isMandatory: true },
      { name: "كيمياء", weeklyHours: 4, isMandatory: true },
      { name: "أحياء", weeklyHours: 4, isMandatory: true },
      { name: "لغة إنجليزية", weeklyHours: 4, isMandatory: true },
      { name: "لغة فرنسية", weeklyHours: 3, isMandatory: true },
      { name: "تربية رياضية", weeklyHours: 1, isMandatory: true },
      { name: "فلسفة", weeklyHours: 2, isMandatory: true },
    ]
  }
];

// Alternative subjects for literary track of Baccalaureate
export const BACCALAUREATE_LITERARY_SUBJECTS: SubjectConfig[] = [
  { name: "قرآن كريم", weeklyHours: 2, isMandatory: true },
  { name: "تربية إسلامية", weeklyHours: 2, isMandatory: true },
  { name: "لغة عربية", weeklyHours: 6, isMandatory: true },
  { name: "تاريخ", weeklyHours: 4, isMandatory: true },
  { name: "جغرافيا", weeklyHours: 4, isMandatory: true },
  { name: "فلسفة", weeklyHours: 4, isMandatory: true },
  { name: "علم نفس", weeklyHours: 3, isMandatory: true },
  { name: "رياضيات", weeklyHours: 3, isMandatory: true },
  { name: "لغة إنجليزية", weeklyHours: 4, isMandatory: true },
  { name: "لغة فرنسية", weeklyHours: 4, isMandatory: true },
  { name: "تربية رياضية", weeklyHours: 1, isMandatory: true },
];

// Helper function to get subjects for a specific grade
export function getSubjectsForGrade(gradeName: string): SubjectConfig[] {
  const gradeData = DEFAULT_SUBJECTS.find(g => g.gradeName === gradeName);
  return gradeData ? gradeData.subjects : [];
}

// Helper function to get total hours for a grade
export function getTotalHoursForGrade(gradeName: string): number {
  const gradeData = DEFAULT_SUBJECTS.find(g => g.gradeName === gradeName);
  return gradeData ? gradeData.totalHours : 0;
}

// Helper function to get all available subjects (unique names)
export function getAllUniqueSubjects(): string[] {
  const allSubjects = new Set<string>();
  DEFAULT_SUBJECTS.forEach(grade => {
    grade.subjects.forEach(subject => {
      allSubjects.add(subject.name);
    });
  });
  // Add literary track subjects
  BACCALAUREATE_LITERARY_SUBJECTS.forEach(subject => {
    allSubjects.add(subject.name);
  });
  return Array.from(allSubjects).sort();
}

// Helper function to get grades that have a specific subject
export function getGradesForSubject(subjectName: string): string[] {
  return DEFAULT_SUBJECTS
    .filter(grade => grade.subjects.some(s => s.name === subjectName))
    .map(grade => grade.gradeName);
}