/**
 * Migration utilities for handling version updates
 * This module provides functions to execute migrations between app versions
 */

import { APP_VERSION, compareVersions, getMigrationPath } from "./version";
import { LOCAL_STORAGE_KEYS } from "./localStorageService";
import {
  companyMigrations,
  reviewMigrations,
  generalMigrations,
} from "./migrationStrategies";

/**
 * Migration logger - handles consistent logging of migration operations
 */
export const migrationLogger = {
  /**
   * Create a prefixed logger for a specific version
   * @param {string} version - Version being migrated to
   * @returns {Object} Logger object with methods for different log levels
   */
  forVersion: (version) => {
    const prefix = `[Migration ${version}]`;

    return {
      info: (message) => console.info(`${prefix} ${message}`),
      warn: (message) => console.warn(`${prefix} ${message}`),
      error: (message, error) => {
        console.error(`${prefix} ${message}`, error);
        // Could also send error to a monitoring service in production
      },
      success: (message) => console.log(`${prefix} ✓ ${message}`),
    };
  },

  // General migration logs
  start: (fromVersion, toVersion) =>
    console.log(`🔄 Starting migration from v${fromVersion} to v${toVersion}`),

  complete: (fromVersion, toVersion) =>
    console.log(
      `✅ Successfully migrated from v${fromVersion} to v${toVersion}`
    ),

  failed: (fromVersion, toVersion, error) =>
    console.error(
      `❌ Migration failed from v${fromVersion} to v${toVersion}:`,
      error
    ),
};

/**
 * Helper to create a standardized migration function
 *
 * @param {Object} options - Migration options
 * @param {Array<string>} options.affects - Array of localStorage keys affected
 * @param {Function} options.migrate - The actual migration function
 * @returns {Function} Properly structured migration function
 */
export function createMigration({ affects = [], migrate }) {
  return async (fromVersion, toVersion) => {
    const logger = migrationLogger.forVersion(toVersion);

    try {
      logger.info(
        `Starting migration for keys: ${affects.join(", ") || "none"}`
      );

      // Run the migration function
      const result = await migrate(fromVersion, toVersion, logger);

      logger.success("Migration completed successfully");
      return {
        success: true,
        affectedKeys: affects,
        ...result,
      };
    } catch (error) {
      logger.error("Migration failed", error);
      return {
        success: false,
        affectedKeys: affects,
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  };
}

/**
 * Registry of migration functions
 * Each key is a version string, and the value is a function that performs the migration
 * Migration functions should return a Promise that resolves when migration is complete
 */
export const migrations = {
  // Example migration function for a hypothetical future version:
  // '1.1.0': createMigration({
  //   affects: [LOCAL_STORAGE_KEYS.COMPANIES],
  //   migrate: async (fromVersion, toVersion, logger) => {
  //     logger.info('Updating company schema...');
  //
  //     // Example: Update the structure of companies in localStorage
  //     const companies = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.COMPANIES) || '[]');
  //
  //     // Apply transformation to companies data
  //     const updatedCompanies = companies.map(company => ({
  //       ...company,
  //       // Add new fields or transform existing ones
  //       industryCategory: company.industry || 'Unknown',
  //       lastUpdated: new Date().toISOString()
  //     }));
  //
  //     // Save back to localStorage
  //     localStorage.setItem(LOCAL_STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
  //
  //     return {
  //       companiesUpdated: updatedCompanies.length,
  //       message: 'Company data structure updated with new fields'
  //     };
  //   }
  // }),
};

/**
 * Check if the app needs to be migrated from stored version to current version
 * @param {string} storedVersion - The version stored in localStorage
 * @returns {boolean} Whether migration is needed
 */
export async function checkMigrationNeeded(storedVersion) {
  // If no stored version, this is first run or data was cleared
  if (!storedVersion) return false;

  // Check if stored version is different from current
  return compareVersions(storedVersion, APP_VERSION) !== 0;
}

/**
 * Execute migrations from stored version to current app version
 * @param {string} storedVersion - The version stored in localStorage
 * @returns {Object} Migration result with success status and details
 */
export async function executeMigrations(storedVersion) {
  if (!storedVersion || storedVersion === APP_VERSION) {
    return { success: true, message: "No migration needed" };
  }

  try {
    // Get all versions that need migration between stored and current
    const migrationPath = getMigrationPath(storedVersion, APP_VERSION);

    if (migrationPath.length === 0) {
      return {
        success: true,
        message: `No migrations required from ${storedVersion} to ${APP_VERSION}`,
      };
    }

    // Log the start of migration process
    migrationLogger.start(storedVersion, APP_VERSION);

    const results = [];
    const affectedKeys = new Set();

    // Execute each migration in sequence
    for (const versionInfo of migrationPath) {
      const version = versionInfo.version;
      const migrationFn = migrations[version];

      if (migrationFn) {
        try {
          // Execute migration and track results
          const result = await migrationFn(storedVersion, version);

          // Add affected keys to the set
          if (result.affectedKeys && Array.isArray(result.affectedKeys)) {
            result.affectedKeys.forEach((key) => affectedKeys.add(key));
          }

          results.push({
            version,
            success: result.success,
            affectedKeys: result.affectedKeys,
            details: result,
          });

          // If a migration fails, stop the process
          if (!result.success) {
            migrationLogger.failed(storedVersion, version, result.error);
            return {
              success: false,
              message: `Migration failed for version ${version}: ${
                result.error?.message || "Unknown error"
              }`,
              affectedKeys: Array.from(affectedKeys),
              error: result.error,
              results,
            };
          }
        } catch (error) {
          migrationLogger.failed(storedVersion, version, error);

          // Return failure with details about which migration failed
          return {
            success: false,
            message: `Migration failed for version ${version}: ${error.message}`,
            error,
            affectedKeys: Array.from(affectedKeys),
            results,
          };
        }
      } else {
        // No migration function found for this version
        const logger = migrationLogger.forVersion(version);
        logger.warn(`No migration function defined for this version`);
      }
    }

    // Log successful completion
    migrationLogger.complete(storedVersion, APP_VERSION);

    return {
      success: true,
      message: `Successfully migrated from ${storedVersion} to ${APP_VERSION}`,
      affectedKeys: Array.from(affectedKeys),
      results,
    };
  } catch (error) {
    migrationLogger.failed(storedVersion, APP_VERSION, error);

    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      error,
    };
  }
}

/**
 * Helper function to safely clear specific localStorage items
 * @param {Array} keys - Array of localStorage keys to clear
 */
export function clearStorageItems(keys) {
  if (!keys || !Array.isArray(keys)) return;

  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage item ${key}:`, error);
    }
  });
}

/**
 * Helper functions for working with review cache keys
 */
export const reviewCacheHelpers = {
  /**
   * Get the cache key for reviews of a specific company
   * @param {string|number} glassdoorId - The Glassdoor ID of the company
   * @returns {string} The localStorage key for the reviews cache
   */
  getKey: (glassdoorId) => `reviews_${glassdoorId}`,

  /**
   * Find all review cache keys in localStorage
   * @returns {Array<string>} Array of review cache keys
   */
  findAllKeys: () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("reviews_")) {
        keys.push(key);
      }
    }
    return keys;
  },

  /**
   * Clear all review cache from localStorage
   * @returns {number} Number of cache items cleared
   */
  clearAllCache: () => {
    const keys = reviewCacheHelpers.findAllKeys();
    clearStorageItems(keys);
    return keys.length;
  },

  /**
   * Get reviews from cache for a specific company
   * @param {string|number} glassdoorId - The Glassdoor ID of the company
   * @returns {Object|null} The cached reviews data or null if not found/valid
   */
  getReviews: (glassdoorId) => {
    const key = reviewCacheHelpers.getKey(glassdoorId);
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return parsed;
    } catch (e) {
      console.error(`Error accessing review cache for ${glassdoorId}:`, e);
      return null;
    }
  },
};
