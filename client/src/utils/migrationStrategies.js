/**
 * Migration strategies for different data structures and versions
 * This module contains implementation details for different migration tasks
 */

import { LOCAL_STORAGE_KEYS } from "./localStorageService";
import { reviewCacheHelpers } from "./migrations";

/**
 * Company data migration strategies
 */
export const companyMigrations = {
  /**
   * Clear all company data (useful for breaking changes)
   * @param {Object} logger - Migration logger
   * @returns {Promise<Object>} Result of migration
   */
  clearAll: async (logger) => {
    logger.info("Clearing all company data");
    localStorage.removeItem(LOCAL_STORAGE_KEYS.COMPANIES);
    return { cleared: true };
  },

  /**
   * Add a new field to all company records
   * @param {string} fieldName - Name of the field to add
   * @param {any} defaultValue - Default value for the new field
   * @param {Object} logger - Migration logger
   * @returns {Promise<Object>} Result of migration with updated company count
   */
  addField: async (fieldName, defaultValue, logger) => {
    const companiesJson = localStorage.getItem(LOCAL_STORAGE_KEYS.COMPANIES);
    if (!companiesJson) {
      logger.warn("No companies found in storage");
      return { updated: 0 };
    }

    try {
      const companies = JSON.parse(companiesJson);

      // Add the new field to each company
      const updatedCompanies = companies.map((company) => ({
        ...company,
        [fieldName]: company[fieldName] ?? defaultValue,
      }));

      // Save back to localStorage
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.COMPANIES,
        JSON.stringify(updatedCompanies)
      );

      return {
        updated: updatedCompanies.length,
        fieldAdded: fieldName,
      };
    } catch (error) {
      logger.error("Failed to add field to companies", error);
      throw error;
    }
  },

  /**
   * Rename a field in all company records
   * @param {string} oldName - Old field name
   * @param {string} newName - New field name
   * @param {Object} logger - Migration logger
   * @returns {Promise<Object>} Result of migration
   */
  renameField: async (oldName, newName, logger) => {
    const companiesJson = localStorage.getItem(LOCAL_STORAGE_KEYS.COMPANIES);
    if (!companiesJson) {
      logger.warn("No companies found in storage");
      return { updated: 0 };
    }

    try {
      const companies = JSON.parse(companiesJson);

      // Rename the field in each company
      const updatedCompanies = companies.map((company) => {
        const result = { ...company };
        if (oldName in result) {
          result[newName] = result[oldName];
          delete result[oldName];
        }
        return result;
      });

      // Save back to localStorage
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.COMPANIES,
        JSON.stringify(updatedCompanies)
      );

      return {
        updated: updatedCompanies.length,
        fieldRenamed: { from: oldName, to: newName },
      };
    } catch (error) {
      logger.error("Failed to rename field in companies", error);
      throw error;
    }
  },
};

/**
 * Review cache migration strategies
 */
export const reviewMigrations = {
  /**
   * Clear all review caches
   * @param {Object} logger - Migration logger
   * @returns {Promise<Object>} Result of migration
   */
  clearAllCache: async (logger) => {
    try {
      logger.info("Clearing all review caches");
      const count = reviewCacheHelpers.clearAllCache();
      logger.success(`Cleared ${count} review cache entries`);
      return { clearedCount: count };
    } catch (error) {
      logger.error("Failed to clear review caches", error);
      throw error;
    }
  },

  /**
   * Update the structure of cached reviews
   * @param {Function} transformer - Function that transforms each review
   * @param {Object} logger - Migration logger
   * @returns {Promise<Object>} Result of migration
   */
  transformReviews: async (transformer, logger) => {
    try {
      const cacheKeys = reviewCacheHelpers.findAllKeys();
      logger.info(`Found ${cacheKeys.length} review cache entries to update`);

      let updatedCount = 0;
      let failedCount = 0;

      for (const key of cacheKeys) {
        try {
          const cacheData = localStorage.getItem(key);
          if (!cacheData) continue;

          const cache = JSON.parse(cacheData);

          if (cache && Array.isArray(cache.reviews)) {
            // Transform each review in the cache
            const transformedReviews = cache.reviews.map(transformer);

            // Update the cache with transformed reviews
            cache.reviews = transformedReviews;
            cache.lastMigrated = new Date().toISOString();

            localStorage.setItem(key, JSON.stringify(cache));
            updatedCount++;
          }
        } catch (e) {
          logger.warn(`Failed to transform review cache: ${key}`);
          failedCount++;
        }
      }

      return {
        processed: cacheKeys.length,
        updated: updatedCount,
        failed: failedCount,
      };
    } catch (error) {
      logger.error("Failed to transform review caches", error);
      throw error;
    }
  },
};

/**
 * General migration utilities
 */
export const generalMigrations = {
  /**
   * Execute a function for each localStorage key that matches a pattern
   * @param {RegExp} pattern - Pattern to match keys against
   * @param {Function} handler - Handler function for each matching item
   * @param {Object} logger - Migration logger
   * @returns {Promise<Object>} Result with processed, succeeded and failed counts
   */
  forEachMatchingKey: async (pattern, handler, logger) => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && pattern.test(key)) {
        keys.push(key);
      }
    }

    logger.info(`Found ${keys.length} matching keys`);

    let succeeded = 0;
    let failed = 0;

    for (const key of keys) {
      try {
        await handler(key, localStorage.getItem(key));
        succeeded++;
      } catch (error) {
        logger.error(`Error processing key: ${key}`, error);
        failed++;
      }
    }

    return {
      processed: keys.length,
      succeeded,
      failed,
    };
  },

  /**
   * Clear all localStorage
   * @param {Array<string>} exceptKeys - Keys to preserve (optional)
   * @param {Object} logger - Migration logger
   * @returns {Promise<Object>} Result of operation
   */
  clearAllStorage: async (exceptKeys = [], logger) => {
    try {
      logger.info("Clearing all localStorage");

      const preserveData = {};

      // Save data for keys we want to preserve
      if (exceptKeys.length > 0) {
        logger.info(`Preserving ${exceptKeys.length} keys`);
        exceptKeys.forEach((key) => {
          preserveData[key] = localStorage.getItem(key);
        });
      }

      // Clear storage
      const itemCount = localStorage.length;
      localStorage.clear();

      // Restore preserved keys
      Object.keys(preserveData).forEach((key) => {
        if (preserveData[key] !== null) {
          localStorage.setItem(key, preserveData[key]);
        }
      });

      return {
        cleared: itemCount,
        preserved: exceptKeys.length,
      };
    } catch (error) {
      logger.error("Failed to clear localStorage", error);
      throw error;
    }
  },
};
