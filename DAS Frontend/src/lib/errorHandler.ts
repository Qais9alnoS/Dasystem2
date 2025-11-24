import { toast } from '@/hooks/use-toast';

// Error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

// Error messages configuration
const ERROR_MESSAGES = {
  [ErrorCategory.NETWORK]: {
    title: 'خطأ في الشبكة',
    description: 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
    icon: '📶'
  },
  [ErrorCategory.AUTHENTICATION]: {
    title: 'خطأ في تسجيل الدخول',
    description: 'بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور.',
    icon: '🔐'
  },
  [ErrorCategory.AUTHORIZATION]: {
    title: 'وصول غير مصرح به',
    description: 'ليس لديك الصلاحيات اللازمة للوصول إلى هذا المحتوى.',
    icon: '🚫'
  },
  [ErrorCategory.VALIDATION]: {
    title: 'بيانات غير صحيحة',
    description: 'بعض البيانات المدخلة غير صحيحة. يرجى التحقق من المعلومات والمحاولة مرة أخرى.',
    icon: '📝'
  },
  [ErrorCategory.SERVER]: {
    title: 'خطأ في الخادم',
    description: 'حدث خطأ في الخادم. يرجى المحاولة لاحقًا.',
    icon: '🔧'
  },
  [ErrorCategory.CLIENT]: {
    title: 'خطأ في التطبيق',
    description: 'حدث خطأ في التطبيق. يرجى المحاولة لاحقًا أو إعادة تشغيل التطبيق.',
    icon: '💻'
  },
  [ErrorCategory.UNKNOWN]: {
    title: 'خطأ غير معروف',
    description: 'حدث خطأ غير متوقع. يرجى المحاولة لاحقًا.',
    icon: '❓'
  }
};

// API Error Handler
export class ErrorHandler {
  static handleApiError(error: ApiError): ErrorCategory {
    console.error('API Error:', error);

    // Network errors
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      this.showToast(ErrorCategory.NETWORK);
      return ErrorCategory.NETWORK;
    }

    // HTTP status based errors
    switch (error.status) {
      case 401:
        this.showToast(ErrorCategory.AUTHENTICATION);
        // Redirect to login if needed
        if (typeof window !== 'undefined') {
          localStorage.removeItem('das_token');
          localStorage.removeItem('das_user');
          window.location.href = '/login';
        }
        return ErrorCategory.AUTHENTICATION;
      
      case 403:
        this.showToast(ErrorCategory.AUTHORIZATION);
        return ErrorCategory.AUTHORIZATION;
      
      case 400:
      case 422:
        this.showToast(ErrorCategory.VALIDATION);
        return ErrorCategory.VALIDATION;
      
      case 500:
      case 502:
      case 503:
      case 504:
        this.showToast(ErrorCategory.SERVER);
        return ErrorCategory.SERVER;
      
      default:
        this.showToast(ErrorCategory.UNKNOWN);
        return ErrorCategory.UNKNOWN;
    }
  }

  // Frontend Error Handler
  static handleFrontendError(error: Error): ErrorCategory {
    console.error('Frontend Error:', error);
    
    // Validation errors
    if (error.name === 'ValidationError') {
      this.showToast(ErrorCategory.VALIDATION);
      return ErrorCategory.VALIDATION;
    }
    
    // Generic client errors
    this.showToast(ErrorCategory.CLIENT);
    return ErrorCategory.CLIENT;
  }

  // Validation Error Handler
  static handleValidationErrors(errors: ValidationError[]) {
    console.error('Validation Errors:', errors);
    
    // Show detailed validation errors
    errors.forEach(error => {
      toast({
        title: `خطأ في الحقل: ${error.field}`,
        description: error.message,
        variant: 'destructive',
        duration: 5000
      });
    });
    
    this.showToast(ErrorCategory.VALIDATION);
  }

  // Show toast notification
  private static showToast(category: ErrorCategory) {
    const message = ERROR_MESSAGES[category];
    
    toast({
      title: message.title,
      description: message.description,
      variant: 'destructive',
      duration: 7000
    });
  }

  // Format error for display
  static formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.detail) {
      return error.detail;
    }
    
    if (error?.errors && Array.isArray(error.errors)) {
      return error.errors.join(', ');
    }
    
    return 'حدث خطأ غير معروف';
  }
}

// Global error handler
export const setupGlobalErrorHandling = () => {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    ErrorHandler.handleFrontendError(event.error);
    
    // Send to Telegram
    try {
      const { reportErrorToTelegram } = require('@/services/telegramErrorService');
      reportErrorToTelegram(
        event.error || new Error(event.message || 'Unknown error'),
        `Global Error Handler: ${event.filename || 'Unknown'}:${event.lineno || '?'}:${event.colno || '?'}`,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    } catch (telegramError) {
      console.warn('Failed to send error to Telegram:', telegramError);
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handleFrontendError(event.reason);
    
    // Send to Telegram
    try {
      const { reportErrorToTelegram } = require('@/services/telegramErrorService');
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason || 'Unhandled promise rejection'));
      reportErrorToTelegram(
        error,
        'Unhandled Promise Rejection',
        {
          reason: String(event.reason),
        }
      );
    } catch (telegramError) {
      console.warn('Failed to send error to Telegram:', telegramError);
    }
    
    event.preventDefault();
  });

  // Intercept console.error
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    
    // Send to Telegram
    try {
      const { reportErrorToTelegram } = require('@/services/telegramErrorService');
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      reportErrorToTelegram(
        new Error(errorMessage),
        'Console.error',
        {
          console_args: args.map(arg => typeof arg === 'object' ? String(arg) : arg),
        }
      );
    } catch (telegramError) {
      // Silently fail to avoid infinite loop
    }
  };

  // Intercept console.warn
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);
    
    // Send to Telegram (only in production to avoid spam)
    if (process.env.NODE_ENV === 'production') {
      try {
        const { reportWarningToTelegram } = require('@/services/telegramErrorService');
        const warningMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        reportWarningToTelegram(
          warningMessage,
          'Console.warn',
          {
            console_args: args.map(arg => typeof arg === 'object' ? String(arg) : arg),
          }
        );
      } catch (telegramError) {
        // Silently fail to avoid infinite loop
      }
    }
  };
};

export default ErrorHandler;