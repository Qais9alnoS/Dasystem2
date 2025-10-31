// Tauri v2 API type declarations
import type { Window } from '@tauri-apps/api/window';
import type { WebviewWindow } from '@tauri-apps/api/webviewWindow';

// Re-export common Tauri v2 types for easy access
export type {
    Window,
    WebviewWindow,
    Event,
    EventCallback,
    UnlistenFn
} from '@tauri-apps/api/window';

export type {
    InvokeArgs
} from '@tauri-apps/api/core';

export type {
    Options as ShellOptions
} from '@tauri-apps/plugin-shell';

export type {
    FileEntry,
    DirEntry,
    ReadOptions,
    WriteFileOptions,
    MkdirOptions
} from '@tauri-apps/plugin-fs';

export type {
    PermissionState
} from '@tauri-apps/plugin-notification';

// Window management functions
export type {
    getCurrent
} from '@tauri-apps/api/window';

// Global window extensions for Tauri v2
declare global {
    interface Window {
        // Tauri v2 no longer uses global window objects
        // All APIs are imported directly from modules
    }
}

export { };