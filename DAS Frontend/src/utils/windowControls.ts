import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

/**
 * Minimize the current window
 */
export async function minimizeWindow(): Promise<void> {
  try {
    const currentWindow = getCurrentWindow();
    await currentWindow.minimize();
  } catch (error) {

  }
}

/**
 * Maximize/unmaximize the current window
 */
export async function toggleMaximizeWindow(): Promise<void> {
  try {
    const currentWindow = getCurrentWindow();
    const isMaximized = await currentWindow.isMaximized();
    if (isMaximized) {
      await currentWindow.unmaximize();
    } else {
      await currentWindow.maximize();
    }
  } catch (error) {

  }
}

/**
 * Close the current window
 */
export async function closeWindow(): Promise<void> {
  try {
    const currentWindow = getCurrentWindow();
    await currentWindow.close();
  } catch (error) {

  }
}

/**
 * Handle search functionality
 */
export async function handleSearch(query: string): Promise<void> {
  try {
    const result = await invoke('handle_search', { query });

  } catch (error) {

  }
}

/**
 * Handle settings functionality
 */
export async function handleSettings(): Promise<void> {
  try {
    const result = await invoke('open_settings');

  } catch (error) {

  }
}

/**
 * Handle theme toggle functionality
 */
export async function handleThemeToggle(): Promise<void> {
  try {
    const result = await invoke('toggle_theme');

  } catch (error) {

  }
}