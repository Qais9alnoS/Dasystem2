// Platform detection and title bar utilities for unified title bar experience

export type Platform = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
    if (typeof window === 'undefined') return 'unknown';

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';

    return 'unknown';
}

/**
 * Get title bar height for the current platform
 */
export function getTitleBarHeight(): number {
    const platform = detectPlatform();

    switch (platform) {
        case 'windows':
            return 32; // Standard Windows title bar height
        case 'macos':
            return 28; // Standard macOS title bar height
        case 'linux':
            return 32; // Assuming similar to Windows
        default:
            return 32;
    }
}

/**
 * Get window controls reserve space for the current platform
 */
export function getWindowControlsSpace(): number {
    const platform = detectPlatform();

    switch (platform) {
        case 'windows':
            return 138; // Width for minimize, maximize, close buttons
        case 'macos':
            return 78; // Width for close, minimize, maximize buttons (left side)
        case 'linux':
            return 120; // Varies by DE, conservative estimate
        default:
            return 138;
    }
}

/**
 * Get platform-specific CSS class for title bar
 */
export function getTitleBarPlatformClass(): string {
    const platform = detectPlatform();
    return `titlebar-${platform}`;
}

/**
 * Check if the current environment supports title bar overlay
 */
export function supportsTitleBarOverlay(): boolean {
    // Check if we're in a Tauri environment and if overlay is supported
    return typeof window !== 'undefined' &&
        'Navigator' in window &&
        'userAgentData' in (window.navigator as any);
}

/**
 * Apply safe area padding based on platform and overlay support
 */
export function applySafeAreaStyles(): React.CSSProperties {
    const platform = detectPlatform();
    const titleBarHeight = getTitleBarHeight();

    const baseStyles: React.CSSProperties = {
        paddingTop: `${titleBarHeight}px`,
    };

    if (platform === 'macos') {
        // macOS has controls on the left, so we need left padding
        baseStyles.paddingLeft = `${getWindowControlsSpace()}px`;
    } else {
        // Windows and Linux have controls on the right
        baseStyles.paddingRight = `${getWindowControlsSpace()}px`;
    }

    return baseStyles;
}