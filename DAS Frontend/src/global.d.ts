// Global TypeScript definitions for Webpack environment

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly API_BASE_URL?: string;
    readonly TELEGRAM_ERROR_REPORTING?: string;
    // Add other environment variables here as needed
  }
}
