/**
 * Version storage service for managing app versioning
 * This module provides functions to track and update app version in local storage
 */

import { APP_VERSION, compareVersions } from "./version";
import { checkMigrationNeeded, executeMigrations } from "./migrations";
import { LOCAL_STORAGE_KEYS } from "./localStorageService";

// Key for storing app version in localStorage
export const VERSION_STORAGE_KEY = LOCAL_STORAGE_KEYS.APP_VERSION;

/**
 * Get the stored app version from localStorage
 * @returns {string|null} Stored version or null if not set
 */
export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_STORAGE_KEY);
};

/**
 * Save the current app version to localStorage
 * @returns {string} The saved version
 */
export const saveCurrentVersion = () => {
  localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
  return APP_VERSION;
};

/**
 * Check if app is running for the first time or has been updated
 * @returns {Object} Status object with:
 *  - firstRun: boolean, true if this is the first run
 *  - updated: boolean, true if app was updated
 *  - fromVersion: string, previous version if updated
 *  - toVersion: string, current version
 */
export const checkVersionStatus = () => {
  const storedVersion = getStoredVersion();

  // First run scenario
  if (!storedVersion) {
    return {
      firstRun: true,
      updated: false,
      fromVersion: null,
      toVersion: APP_VERSION,
    };
  }

  // Check if version has changed
  const versionCompare = compareVersions(storedVersion, APP_VERSION);
  const updated = versionCompare !== 0;

  return {
    firstRun: false,
    updated,
    fromVersion: storedVersion,
    toVersion: APP_VERSION,
    isNewer: versionCompare < 0, // Is APP_VERSION newer than stored?
    isOlder: versionCompare > 0, // Is APP_VERSION older than stored?
  };
};

/**
 * Initialize version tracking and run migrations if needed
 * @returns {Promise<Object>} Result of initialization with migration status
 */
export const initializeVersioning = async () => {
  const status = checkVersionStatus();

  // If this is an update, check and run migrations
  if (status.updated && status.isNewer) {
    const migrationNeeded = await checkMigrationNeeded(status.fromVersion);

    if (migrationNeeded) {
      console.log(
        `Migration needed from v${status.fromVersion} to v${APP_VERSION}`
      );

      // Execute migrations from the old version to the current version
      const migrationResult = await executeMigrations(status.fromVersion);

      // Save current version after successful migration
      if (migrationResult.success) {
        console.log(
          `Migration successful, saving new version: v${APP_VERSION}`
        );
        saveCurrentVersion();
      } else {
        console.error(`Migration failed:`, migrationResult.message);
      }

      return {
        ...status,
        migrationNeeded,
        migrationResult,
      };
    } else {
      console.log(
        `No migration needed for update from v${status.fromVersion} to v${APP_VERSION}`
      );
    }
  }

  // Save current version (for first run or if no migration needed)
  if (status.firstRun || status.updated) {
    saveCurrentVersion();
  }

  return {
    ...status,
    migrationNeeded: false,
    migrationResult: { success: true, message: "No migration needed" },
  };
};
