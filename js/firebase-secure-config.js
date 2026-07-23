// ===== Firebase Secure Configuration =====
// This file handles sensitive configuration like Admin UID
// IMPORTANT: The actual admin UID should NOT be in version control
// Instead, it should be loaded from environment or a secure config file

// Development: Load from localStorage or a config object
// Production: Load from environment variables or Cloud Functions

/**
 * Get Admin UID for Firestore security rules
 * In production, this should come from a secure config service
 */
export function getAdminUID() {
  // Try multiple sources for admin UID (in order of preference):

  // 1. Environment variable (if running in a build environment)
  if (typeof process !== 'undefined' && process.env?.FIREBASE_ADMIN_UID) {
    return process.env.FIREBASE_ADMIN_UID;
  }

  // 2. Window global (set by build script)
  if (typeof window !== 'undefined' && window.__FIREBASE_ADMIN_UID__) {
    return window.__FIREBASE_ADMIN_UID__;
  }

  // 3. LocalStorage (for local development)
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('firebase_admin_uid');
    if (stored) return stored;
  }

  // 4. Hardcoded fallback (for development only)
  // TODO: Remove this in production - use secure configuration instead
  return 'ucc6ZqLoCbU2HlAcS7SKaYa4ft43';
}

/**
 * Set Admin UID (for development/testing)
 * In production, admin UID should be read-only from config service
 */
export function setAdminUID(uid) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('firebase_admin_uid', uid);
    console.warn('⚠️ Admin UID updated in localStorage. This is for development only.');
  }
}

/**
 * Validate Admin UID format
 */
export function isValidUID(uid) {
  // Firebase UIDs are 28 character alphanumeric strings
  return typeof uid === 'string' && uid.length === 28 && /^[a-zA-Z0-9]+$/.test(uid);
}

/**
 * Get Firebase configuration
 * In production, this should come from a secure config service
 */
export function getFirebaseConfig() {
  // Try to load from window (set by build script)
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) {
    return window.__FIREBASE_CONFIG__;
  }

  // Fallback to hardcoded config for development
  // In production, move this to a secure config service or environment variables
  return {
    apiKey: "AIzaSyCqERPPe2wcr_BKVwSlz07EKc5Ormlld_Y",
    authDomain: "websangudom.firebaseapp.com",
    projectId: "websangudom",
    storageBucket: "websangudom.firebasestorage.app",
    messagingSenderId: "47183761185",
    appId: "1:47183761185:web:5a05f007803882e3647860"
  };
}

export default {
  getAdminUID,
  setAdminUID,
  isValidUID,
  getFirebaseConfig
};
