import { invoke } from '@tauri-apps/api/core';

/**
 * Toggle the application theme between light and dark mode
 */
export async function toggleTheme(): Promise<void> {
  try {
    const result = await invoke('toggle_theme');
    console.log('Theme toggle result:', result);
  } catch (error) {
    console.error('Failed to toggle theme:', error);
  }
}

/**
 * Set the application theme explicitly
 */
export async function setTheme(theme: 'light' | 'dark'): Promise<void> {
  try {
    // This would require a corresponding Rust command
    console.log(`Setting theme to ${theme}`);
    // Implementation would depend on how you want to handle explicit theme setting
  } catch (error) {
    console.error(`Failed to set theme to ${theme}:`, error);
  }
}