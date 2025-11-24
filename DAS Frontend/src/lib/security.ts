// Security utilities for input sanitization and validation

// Sanitize HTML content to prevent XSS attacks
export const sanitizeHTML = (content: string): string => {
    if (!content) return '';
    
    // Remove HTML tags and encode special characters
    return content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Sanitize text input to prevent XSS and other injection attacks
export const sanitizeTextInput = (text: string): string => {
    if (!text) return '';
    
    // Remove potentially dangerous characters
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Validate and sanitize email addresses
export const sanitizeEmail = (email: string): string => {
    if (!email) return '';
    
    // Basic email validation and sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    
    // Sanitize the email
    return sanitizeTextInput(email.toLowerCase().trim());
};

// Validate and sanitize phone numbers
export const sanitizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove all non-digit characters except + at the beginning
    let sanitized = phone.replace(/[^0-9+]/g, '');
    
    // Ensure + is only at the beginning
    if (sanitized.startsWith('+')) {
        sanitized = '+' + sanitized.substring(1).replace(/\+/g, '');
    }
    
    // Validate phone number format for Iraqi numbers
    const phoneRegex = /^(\+964|0)[0-9]{10}$/;
    if (!phoneRegex.test(sanitized)) {
        throw new Error('Invalid phone number format');
    }
    
    return sanitized;
};

// Sanitize file names to prevent directory traversal attacks
export const sanitizeFileName = (fileName: string): string => {
    if (!fileName) return '';
    
    // Remove path traversal sequences
    return fileName
        .replace(/\.\./g, '')
        .replace(/[\/\\]/g, '')
        .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
        .trim();
};

// Validate and sanitize URLs
export const sanitizeURL = (url: string): string => {
    if (!url) return '';
    
    try {
        // Create URL object to validate
        const urlObj = new URL(url);
        
        // Only allow http and https protocols
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            throw new Error('Invalid protocol');
        }
        
        // Return sanitized URL
        return urlObj.toString();
    } catch (error) {
        throw new Error('Invalid URL format');
    }
};

// Sanitize JSON data
export const sanitizeJSON = (data: any): any => {
    if (typeof data === 'string') {
        return sanitizeTextInput(data);
    } else if (Array.isArray(data)) {
        return data.map(item => sanitizeJSON(item));
    } else if (typeof data === 'object' && data !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[sanitizeTextInput(key)] = sanitizeJSON(value);
        }
        return sanitized;
    }
    return data;
};

// Generate secure random string for tokens
export const generateSecureToken = (length: number = 32): string => {
    const array = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
    } else {
        // Fallback for Node.js environment
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash sensitive data (simple implementation - in production, use proper crypto library)
export const hashData = (data: string): string => {
    // This is a simple hash function for demonstration
    // In production, use a proper cryptographic hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
};

// Check if user has required permissions
export const checkPermissions = (userRole: string, requiredRoles: string[]): boolean => {
    return requiredRoles.includes(userRole);
};

// Rate limiting utility
export class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private maxRequests: number;
    private timeWindow: number; // in milliseconds

    constructor(maxRequests: number = 10, timeWindow: number = 60000) { // 10 requests per minute
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
    }

    canMakeRequest(identifier: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];
        
        // Remove old requests outside the time window
        const recentRequests = requests.filter(time => now - time < this.timeWindow);
        
        // Check if limit exceeded
        if (recentRequests.length >= this.maxRequests) {
            return false;
        }
        
        // Add current request
        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);
        
        return true;
    }

    reset(identifier: string): void {
        this.requests.delete(identifier);
    }
}

// CSRF token management
export class CSRFTokenManager {
    private static tokenKey = 'csrf_token';
    
    static generateToken(): string {
        const token = generateSecureToken(32);
        localStorage.setItem(this.tokenKey, token);
        return token;
    }
    
    static getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }
    
    static validateToken(token: string): boolean {
        const storedToken = this.getToken();
        return storedToken !== null && storedToken === token;
    }
    
    static clearToken(): void {
        localStorage.removeItem(this.tokenKey);
    }
}

// Security headers for API requests
export const getSecurityHeaders = (): Record<string, string> => {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;",
    };
};

// Input validation for common data types
export const validateInput = {
    // Validate name (Arabic or English)
    name: (name: string): boolean => {
        if (!name || name.length < 2 || name.length > 50) return false;
        // Allow Arabic, English, spaces, and common punctuation
        const nameRegex = /^[\u0600-\u06FFa-zA-Z\s\-'\.]+$/;
        return nameRegex.test(name);
    },
    
    // Validate numeric values
    number: (value: any, min?: number, max?: number): boolean => {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
    },
    
    // Validate date format
    date: (date: string): boolean => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        
        const d = new Date(date);
        return d instanceof Date && !isNaN(d.getTime());
    },
    
    // Validate grade level
    gradeLevel: (grade: string): boolean => {
        const validGrades = ['primary', 'intermediate', 'secondary'];
        return validGrades.includes(grade);
    },
    
    // Validate session type
    sessionType: (session: string): boolean => {
        const validSessions = ['morning', 'evening'];
        return validSessions.includes(session);
    }
};

// Export all utilities
export default {
    sanitizeHTML,
    sanitizeTextInput,
    sanitizeEmail,
    sanitizePhoneNumber,
    sanitizeFileName,
    sanitizeURL,
    sanitizeJSON,
    generateSecureToken,
    hashData,
    checkPermissions,
    RateLimiter,
    CSRFTokenManager,
    getSecurityHeaders,
    validateInput
};