import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, UserRole, AuthResponse, LoginCredentials } from '@/types/school';
import { authApi, setApiToken } from '@/services/api';

// Auth State
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Auth Actions
type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: AuthResponse }
    | { type: 'AUTH_ERROR'; payload: string }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_CLEAR_ERROR' };

// Initial State
const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'AUTH_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.access_token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };
        case 'AUTH_LOGOUT':
            return {
                ...initialState,
            };
        case 'AUTH_CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

// Auth Context
interface AuthContextType {
    state: AuthState;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    hasRole: (role: UserRole) => boolean;
    hasAnyRole: (roles: UserRole[]) => boolean;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // No automatic login - user must login manually each time
    // Clear any stored tokens on mount to ensure fresh login
    useEffect(() => {
        localStorage.removeItem('das_token');
        localStorage.removeItem('das_user');
        setApiToken(null); // Clear token from API client
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            dispatch({ type: 'AUTH_START' });
            const response = await authApi.login(credentials);

            if (response.success && response.data) {
                // Do NOT store in localStorage - user must login manually each time
                // Only keep in memory for current session
                setApiToken(response.data.access_token); // Set token for API client
                dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            dispatch({
                type: 'AUTH_ERROR',
                payload: errorMessage
            });
        }
    };

    const refreshToken = async () => {
        try {
            const response = await authApi.refresh();
            
            if (response.success && response.data) {
                // Do NOT store in localStorage - only keep in memory
                // Update state with new token
                setApiToken(response.data.access_token); // Set token for API client
                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: response.data
                });
            } else {
                throw new Error(response.message || 'Token refresh failed');
            }
        } catch (error) {
            // If refresh fails, logout user
            logout();
            throw error;
        }
    };

    // Add automatic token refresh before token expires
    useEffect(() => {
        let refreshTimeout: NodeJS.Timeout | null = null;
        
        if (state.token && state.isAuthenticated) {
            // Set up token refresh before it expires
            // Assuming token expires in 15 minutes, refresh after 10 minutes
            refreshTimeout = setTimeout(async () => {
                try {
                    await refreshToken();
                } catch (error) {
                    console.error('Automatic token refresh failed:', error);
                }
            }, 10 * 60 * 1000); // 10 minutes
        }
        
        return () => {
            if (refreshTimeout) {
                clearTimeout(refreshTimeout);
            }
        };
    }, [state.token, state.isAuthenticated]);

    const logout = async () => {
        try {
            // Call backend logout endpoint
            await authApi.logout();
        } catch (error) {
            // Even if backend logout fails, we still clear local state
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('das_token');
            localStorage.removeItem('das_user');
            setApiToken(null); // Clear token from API client
            dispatch({ type: 'AUTH_LOGOUT' });
        }
    };

    const clearError = () => {
        dispatch({ type: 'AUTH_CLEAR_ERROR' });
    };

    const hasRole = (role: UserRole): boolean => {
        return state.user?.role === role;
    };

    const hasAnyRole = (roles: UserRole[]): boolean => {
        return state.user ? roles.includes(state.user.role) : false;
    };

    const value: AuthContextType = {
        state,
        login,
        logout,
        clearError,
        hasRole,
        hasAnyRole,
        refreshToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Role-based access control components
interface RequireRoleProps {
    role: UserRole | UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
    role,
    children,
    fallback = null
}) => {
    const { state, hasRole, hasAnyRole } = useAuth();

    if (!state.isAuthenticated) {
        return <>{fallback}</>;
    }

    const hasPermission = Array.isArray(role)
        ? hasAnyRole(role)
        : hasRole(role);

    return hasPermission ? <>{children}</> : <>{fallback}</>;
};

// Route protection component
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    fallback = <div>Access Denied</div>
}) => {
    const { state, hasAnyRole } = useAuth();

    if (!state.isAuthenticated) {
        // Redirect to login will be handled by the router
        return null;
    }

    if (allowedRoles && !hasAnyRole(allowedRoles)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};