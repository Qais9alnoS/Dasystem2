import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupGlobalErrorHandling } from '@/lib/errorHandler';

// Setup global error handling
setupGlobalErrorHandling();

// Add error handling for portals
const originalError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('removeChild') ||
            args[0].includes('NotFoundError') ||
            args[0].includes('node to be removed is not a child'))
    ) {
        // Suppress portal-related DOM errors that don't affect functionality
        return;
    }
    originalError.apply(console, args);
};

const container = document.getElementById("root");
if (!container) {
    throw new Error('Root element not found');
}

const root = createRoot(container);

// Disable StrictMode for production to prevent portal conflicts
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    root.render(<App />);
}
