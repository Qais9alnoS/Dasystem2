#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, command};
use tauri_plugin_decorum::WebviewWindowExt;
use tauri::webview::Color;

// Command to handle search functionality
#[command]
async fn handle_search(query: &str, _window: tauri::Window) -> Result<String, String> {
    println!("Search requested for: {}", query);
    // In a real implementation, this would perform the actual search
    Ok(format!("Searching for: {}", query))
}

// Command to toggle theme
#[command]
async fn toggle_theme(window: tauri::Window) -> Result<String, String> {
    println!("Theme toggle requested");
    // Toggle between light and dark theme
    let current_theme = window.theme().unwrap_or(tauri::Theme::Light);
    let new_theme = match current_theme {
        tauri::Theme::Light => tauri::Theme::Dark,
        tauri::Theme::Dark => tauri::Theme::Light,
        _ => tauri::Theme::Light, // Default to light theme for any other case
    };
    window.set_theme(Some(new_theme)).unwrap();
    // Adjust the overlay titlebar background color to match theme
    let color = match new_theme {
        tauri::Theme::Light => Color(255, 255, 255, 255),
        _ => Color(32, 32, 32, 255),
    };
    let _ = window.set_background_color(Some(color));
    Ok(format!("Theme toggled to {:?}", new_theme))
}

// Command to open settings
#[command]
async fn open_settings(_window: tauri::Window) -> Result<String, String> {
    println!("Settings requested");
    // In a real implementation, this would open the settings window
    Ok("Settings opened".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_decorum::init())
        .invoke_handler(tauri::generate_handler![handle_search, toggle_theme, open_settings])
        .setup(|app| {
            // Create overlay titlebar for main window with native buttons
            let main_window = app.get_webview_window("main").unwrap();
            let _ = main_window.create_overlay_titlebar();
            // Theme-aware background on startup (apply to window)
            let color = match main_window.theme().unwrap_or(tauri::Theme::Light) {
                tauri::Theme::Light => Color(255, 255, 255, 255),
                _ => Color(32, 32, 32, 255),
            };
            let _ = main_window.set_background_color(Some(color));
            
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}