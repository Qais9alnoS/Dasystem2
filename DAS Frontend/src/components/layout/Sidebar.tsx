import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  School,
  Settings,
  Calendar,
  DollarSign,
  FileText,
  GraduationCap,
  ClipboardList,
  Trophy,
  HeartHandshake,
  UserCheck,
  CalendarDays,
  Database,
  HardDrive,
  Bell,
  FileArchive,
  BarChart3,
  Shield,
  Search,
  Building,
  MapPin,
  Phone,
  Mail,
  Clock,
  Cpu,
  MemoryStick,
  Zap,
  Wallet,
  Target,
  StickyNote,
  Book,
  Truck,
  Award,
  Folder,
  Key,
  TrendingUp,
  PieChart,
  Receipt,
  Calculator,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Filter,
  Layers,
  Ban,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelRight,
  Menu,
  X,
  LogOut
} from 'lucide-react';

// Helper function to get role label in Arabic
const getRoleLabel = (role: string): string => {
  const roleLabels: Record<string, string> = {
    director: 'مدير',
    finance: 'مالية',
    morning_school: 'مدرسة صباحية',
    evening_school: 'مدرسة مسائية',
  };
  return roleLabels[role] || role;
};

const Sidebar = ({ isCollapsed, setIsCollapsed, sidebarWidth }) => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useProject();
  const { projects } = state;
  const { logout, state: authState, hasRole, hasAnyRole } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Function to toggle sections
  const toggleSection = (name: string) => {
    setExpandedSections(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  // Determine if we should show text based on sidebar width
  const showText = sidebarWidth > 100;

  // Navigation items with role-based access control
  const allNavItems = [
    {
      name: 'لوحة التحكم',
      href: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['director', 'finance', 'morning_school', 'evening_school'], // All roles
    },
    {
      name: 'السنوات الدراسية',
      href: '/academic-years',
      icon: Calendar,
      allowedRoles: ['director', 'finance', 'morning_school', 'evening_school'], // All roles
    },
    {
      name: 'معلومات المدرسة',
      href: '/school-info',
      icon: School,
      allowedRoles: ['director', 'finance', 'morning_school', 'evening_school'], // All roles
    },
    {
      name: 'ملاحظات المدير',
      href: '/director/notes',
      icon: StickyNote,
      allowedRoles: ['director'], // Director only
      subItems: [
        {
          name: 'الأهداف',
          href: '/director/notes/browse/goals',
          icon: Target,
        },
        {
          name: 'المشاريع',
          href: '/director/notes/browse/projects',
          icon: Folder,
        },
        {
          name: 'مدونات',
          href: '/director/notes/browse/blogs',
          icon: Book,
        },
        {
          name: 'الأمور التعليمية والإدارية',
          href: '/director/notes/browse/educational_admin',
          icon: School,
        },
        {
          name: 'المكافئات',
          href: '/director/notes/rewards',
          icon: Award,
        },
        {
          name: 'المساعدات',
          href: '/director/notes/assistance',
          icon: HeartHandshake,
        },
      ],
    },
    {
      name: 'الطلاب',
      icon: GraduationCap,
      allowedRoles: ['director', 'morning_school', 'evening_school'], // Not for finance
      subItems: [
        {
          name: 'معلومات شخصية',
          href: '/students/personal-info',
          icon: UserCheck,
        },
        {
          name: 'معلومات دراسية',
          href: '/students/academic-info',
          icon: BookOpen,
        },
      ],
    },
    {
      name: 'الأساتذة',
      href: '/teachers',
      icon: Users,
      allowedRoles: ['director', 'finance', 'morning_school', 'evening_school'], // All roles
    },
    {
      name: 'النشاطات',
      href: '/activities',
      icon: Trophy,
      allowedRoles: ['director'], // Director only
    },
    // Add more navigation items here as needed
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    if (!item.allowedRoles) return true; // If no roles specified, show to all
    return authState.user && item.allowedRoles.includes(authState.user.role);
  });

  return (
    <div className={`h-full flex flex-col ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`} dir="rtl">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 px-4">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">DAS</span>
            </div>
            <div className="text-lg font-bold text-primary dark:text-primary">
              نظام إدارة المدرسة
            </div>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelRight className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
          const isExpanded = expandedSections.includes(item.name);
          const isActiveSection = hasSubItems && item.subItems?.some(subItem => 
            location.pathname === subItem.href || location.pathname.startsWith(subItem.href)
          );

          if (hasSubItems) {
            const isParentActive = 'href' in item && location.pathname === item.href;
            return (
              <div key={item.name}>
                <div className="relative">
                  {'href' in item ? (
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive || isActiveSection
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        } ${isCollapsed && !showText ? 'justify-center' : ''}`
                      }
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {showText && (
                          <span className="mr-3 rtl:mr-0 rtl:ml-3">
                            {item.name}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  ) : (
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActiveSection
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } ${isCollapsed && !showText ? 'justify-center' : ''}`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {showText && (
                          <span className="mr-3 rtl:mr-0 rtl:ml-3">
                            {item.name}
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                  {showText && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSection(item.name);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
                {isExpanded && showText && item.subItems && (
                  <div className="mt-1 space-y-1 pr-4 rtl:pr-0 rtl:pl-4">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <NavLink
                          key={subItem.name}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`
                          }
                        >
                          <SubIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="mr-3 rtl:mr-0 rtl:ml-3">
                            {subItem.name}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                } ${isCollapsed && !showText ? 'justify-center' : ''}`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {showText && (
                <span className="mr-3 rtl:mr-0 rtl:ml-3">
                  {item.name}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section & Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="p-4">
          {isCollapsed || !showText ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {authState.user?.username?.[0]?.toUpperCase() || 'م'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {authState.user?.username?.[0]?.toUpperCase() || 'م'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {authState.user?.username || 'مستخدم'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getRoleLabel(authState.user?.role || '')}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Logout Button */}
        <div className="px-4 pb-4">
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 ${
              isCollapsed && !showText ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {showText && (
              <span className="mr-3 rtl:mr-0 rtl:ml-3">
                تسجيل الخروج
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export { Sidebar };