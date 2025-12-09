/**
 * Telegram Error Reporting Service for Frontend
 * Sends errors, warnings, and console logs to Telegram via Backend API
 */

interface ErrorReport {
  error_type: string;
  error_message: string;
  error_location: string;
  error_details?: Record<string, any>;
  stack_trace?: string;
  user_info?: {
    user_id?: number;
    username?: string;
    role?: string;
  };
  browser_info?: {
    user_agent: string;
    url: string;
    referrer?: string;
  };
}

interface WarningReport {
  warning_type: string;
  warning_message: string;
  warning_location: string;
  warning_details?: Record<string, any>;
}

class TelegramErrorService {
  private apiEndpoint: string;
  private enabled: boolean = true;
  private errorQueue: ErrorReport[] = [];
  private warningQueue: WarningReport[] = [];
  private isProcessing: boolean = false;

  constructor() {
    // Get API endpoint from environment or use default
    // Using process.env for Webpack (not import.meta.env which is Vite-specific)
    this.apiEndpoint = process.env.API_BASE_URL || 'http://localhost:8000';
    this.enabled = process.env.TELEGRAM_ERROR_REPORTING !== 'false';

    // Process queue periodically
    if (this.enabled) {
      setInterval(() => this.processQueue(), 5000); // Process every 5 seconds
    }
  }

  private async sendToBackend(endpoint: string, data: any): Promise<void> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.apiEndpoint}/api/system/telegram/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Don't log to console to avoid infinite loop
        // Just silently fail
      }
    } catch (error) {
      // Silently fail to avoid infinite loop
    }
  }

  private getAuthToken(): string | null {
    // Try to get token from memory (not localStorage as per new policy)
    try {
      // Import dynamically to avoid circular dependencies
      const { getApiToken } = require('@/services/api');
      if (getApiToken) {
        return getApiToken();
      }
    } catch {
      // Ignore if module not available
    }
    return null;
  }

  private getUserInfo(): ErrorReport['user_info'] {
    try {
      // Try to get user info from AuthContext
      const authModule = require('@/contexts/AuthContext');
      if (authModule && authModule.useAuth) {
        // This won't work in non-component context, but we'll try
        // In practice, we'll get this from the component that calls this
        return undefined;
      }
    } catch {
      // Ignore if module not available
    }
    return undefined;
  }

  private getBrowserInfo(): ErrorReport['browser_info'] {
    return {
      user_agent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer || undefined,
    };
  }

  async reportError(
    error: Error | string,
    errorLocation: string,
    errorDetails?: Record<string, any>,
    userInfo?: ErrorReport['user_info']
  ): Promise<void> {
    if (!this.enabled) return;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = typeof error === 'string' ? 'StringError' : error.name || 'Error';
    const stackTrace = typeof error === 'string' ? undefined : error.stack;

    const report: ErrorReport = {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation,
      error_details: errorDetails,
      stack_trace: stackTrace,
      user_info: userInfo || this.getUserInfo(),
      browser_info: this.getBrowserInfo(),
    };

    // Add to queue
    this.errorQueue.push(report);

    // Try to send immediately (non-blocking)
    this.processQueue();
  }

  async reportWarning(
    warning: string,
    warningLocation: string,
    warningDetails?: Record<string, any>
  ): Promise<void> {
    if (!this.enabled) return;

    const report: WarningReport = {
      warning_type: 'ConsoleWarning',
      warning_message: warning,
      warning_location: warningLocation,
      warning_details: warningDetails,
    };

    // Add to queue
    this.warningQueue.push(report);

    // Try to send immediately (non-blocking)
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || (!this.errorQueue.length && !this.warningQueue.length)) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process errors
      while (this.errorQueue.length > 0) {
        const error = this.errorQueue.shift();
        if (error) {
          await this.sendToBackend('report-error', error);
        }
      }

      // Process warnings
      while (this.warningQueue.length > 0) {
        const warning = this.warningQueue.shift();
        if (warning) {
          await this.sendToBackend('report-warning', warning);
        }
      }
    } catch (error) {

    } finally {
      this.isProcessing = false;
    }
  }
}

// Create singleton instance
export const telegramErrorService = new TelegramErrorService();

// Export convenience functions
export const reportErrorToTelegram = (
  error: Error | string,
  location: string,
  details?: Record<string, any>,
  userInfo?: ErrorReport['user_info']
) => {
  telegramErrorService.reportError(error, location, details, userInfo);
};

export const reportWarningToTelegram = (
  warning: string,
  location: string,
  details?: Record<string, any>
) => {
  telegramErrorService.reportWarning(warning, location, details);
};

