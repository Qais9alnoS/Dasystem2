import { invoke } from '@tauri-apps/api/core';

/**
 * Toggle the application theme between light and dark mode
 */
export async function toggleTheme(): Promise<void> {
  try {
    const result = await invoke('toggle_theme');

  } catch (error) {

  }
}

/**
 * Set the application theme explicitly
 */
export async function setTheme(theme: 'light' | 'dark'): Promise<void> {
  try {
    // This would require a corresponding Rust command

    // Implementation would depend on how you want to handle explicit theme setting
  } catch (error) {

  }
}