import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Send to Telegram
        try {
            const { reportErrorToTelegram } = require('@/services/telegramErrorService');
            const errorDetails = {
                component_stack: errorInfo.componentStack,
                error_name: error.name,
            };
            reportErrorToTelegram(
                error,
                `ErrorBoundary: ${errorInfo.componentStack?.split('\n')[0] || 'Unknown Component'}`,
                errorDetails
            );
        } catch (telegramError) {
            console.warn('Failed to send error to Telegram:', telegramError);
        }

        // Log to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // Send to monitoring service (e.g., Sentry, LogRocket)
            this.logErrorToService(error, errorInfo);
        }
    }

    private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
        // Implementation for logging to external service
        console.log('Logging error to monitoring service:', { error, errorInfo });
    };

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6" dir="rtl">
                    <Card className="max-w-lg w-full">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <CardTitle className="text-2xl text-red-800">حدث خطأ غير متوقع</CardTitle>
                            <CardDescription className="text-red-600">
                                نعتذر عن هذا الخطأ. فريقنا التقني سيعمل على حل المشكلة.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono text-left" dir="ltr">
                                    <div className="font-bold text-red-600 mb-2">Error:</div>
                                    <div className="text-gray-800">{this.state.error.message}</div>
                                    <div className="font-bold text-red-600 mt-4 mb-2">Stack:</div>
                                    <div className="text-gray-600 text-xs overflow-auto max-h-32">
                                        {this.state.error.stack}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    إعادة المحاولة
                                </Button>

                                <Button
                                    onClick={this.handleReload}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    إعادة تحميل الصفحة
                                </Button>

                                <Button
                                    onClick={this.handleGoHome}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                    <Home className="w-4 h-4" />
                                    الصفحة الرئيسية
                                </Button>
                            </div>

                            {process.env.NODE_ENV === 'production' && (
                                <div className="text-center text-sm text-gray-600">
                                    <p>كود الخطأ: {this.state.error?.name || 'UNKNOWN'}</p>
                                    <p>الوقت: {new Date().toLocaleString('ar')}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                            // Copy error details to clipboard
                                            navigator.clipboard.writeText(
                                                `Error: ${this.state.error?.message}\\nTime: ${new Date().toISOString()}`

                                            );
                                        }}
                                    >
                                        <Bug className="w-3 h-3 mr-1" />
                                        نسخ تفاصيل الخطأ
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    errorFallback?: ReactNode
) => {
    return (props: P) => (
        <ErrorBoundary fallback={errorFallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const handleError = React.useCallback((error: Error) => {
        console.error('Error caught by useErrorHandler:', error);
        setError(error);

        // Log to monitoring service
        if (process.env.NODE_ENV === 'production') {
            // Send to monitoring service
            console.log('Logging error to monitoring service:', error);
        }
    }, []);

    // If there's an error, throw it to be caught by ErrorBoundary
    if (error) {
        throw error;
    }

    return { handleError, resetError };
};

export default ErrorBoundary;
