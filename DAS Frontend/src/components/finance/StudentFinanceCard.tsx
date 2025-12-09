import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, User, AlertCircle, CheckCircle } from 'lucide-react';
import { StudentFinanceSummary } from '@/types/school';

interface StudentFinanceCardProps {
  student: StudentFinanceSummary;
  onClick?: () => void;
  className?: string;
}

export const StudentFinanceCard: React.FC<StudentFinanceCardProps> = ({
  student,
  onClick,
  className = ''
}) => {
  const hasBalance = student.has_outstanding_balance;

  const getGradeLabel = (level: string, number: number) => {
    const levelMap: Record<string, string> = {
      'primary': 'ابتدائي',
      'intermediate': 'إعدادي',
      'secondary': 'ثانوي'
    };
    return `${levelMap[level] || level} - ${number}`;
  };

  const getSessionLabel = (session: string) => {
    return session === 'morning' ? 'صباحي' : 'مسائي';
  };

  return (
    <Card
      className={`ios-card hover:shadow-md transition-all duration-200 cursor-pointer border-r-4 ${
        hasBalance ? 'border-r-red-500' : 'border-r-green-500'
      } ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Student Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                {student.full_name}
              </h3>
              {hasBalance ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>{student.father_name}</span>
              </div>

              {(student.father_phone || student.mother_phone) && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{student.father_phone || student.mother_phone}</span>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {getGradeLabel(student.grade_level, student.grade_number)}
                </Badge>
                {student.section && (
                  <Badge variant="outline" className="text-xs">
                    شعبة {student.section}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {getSessionLabel(student.session_type)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Financial Status */}
          <div className="text-left ml-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">الرصيد</div>
            <div className={`text-lg font-bold ${
              hasBalance ? 'text-red-600' : 'text-green-600'
            }`}>
              {(Number(student.balance) || 0).toLocaleString('ar-SY')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(Number(student.total_paid) || 0).toLocaleString('ar-SY')} / {(Number(student.total_owed) || 0).toLocaleString('ar-SY')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentFinanceCard;

