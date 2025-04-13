import { protect_form_fields } from './tools/browser';

/**
 * Web features initialization options
 */
export interface WebFeaturesOptions {
  /** Enable form protection to prevent fields from being accidentally cleared */
  enableFormProtection?: boolean;
  /** Additional options can be added here in the future */
}

/**
 * Initialize web features with configurable options
 * @param options Configuration options
 */
export function initWebFeatures(options: WebFeaturesOptions = {}) {
  // Set default options
  const { enableFormProtection = true } = options;
  
  // Initialize form protection if enabled
  if (enableFormProtection && typeof window !== 'undefined') {
    // Check if already initialized to avoid duplicate listeners
    if (!(window as any).__formProtectionInitialized) {
      (window as any).__formProtectionInitialized = true;
      
      // Use requestIdleCallback if available for better performance
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          protect_form_fields();
        });
      } else {
        // Fallback to setTimeout
        setTimeout(() => {
          protect_form_fields();
        }, 1000);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initWebFeatures();
  });
} 