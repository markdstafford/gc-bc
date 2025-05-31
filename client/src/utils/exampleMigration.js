/**
 * Example migration for version 1.1.0
 * This file demonstrates how to implement a migration for a future version
 *
 * IMPORTANT: This is just a template and is not currently used.
 * When actually implementing a migration for 1.1.0, import and use in migrations.js
 */

import { createMigration } from "./migrations";
import { LOCAL_STORAGE_KEYS } from "./localStorageService";
import { companyMigrations, reviewMigrations } from "./migrationStrategies";

/**
 * Migration function for upgrading to v1.1.0
 * This example shows how to add new fields to companies and update the review cache structure
 */
export const migrateToV1_1_0 = createMigration({
  // Specify which localStorage keys will be affected by this migration
  affects: [
    LOCAL_STORAGE_KEYS.COMPANIES,
    // Review cache keys are dynamic, so we handle them dynamically in the migration function
  ],

  // The actual migration function
  migrate: async (fromVersion, toVersion, logger) => {
    logger.info(`Starting migration from ${fromVersion} to ${toVersion}`);

    const results = {
      companiesUpdated: 0,
      reviewsUpdated: 0,
      errors: [],
    };

    try {
      // Example: Add a new field to all companies
      const companyResult = await companyMigrations.addField(
        "lastUpdated",
        new Date().toISOString(),
        logger
      );

      results.companiesUpdated = companyResult.updated;
      logger.success(
        `Updated ${companyResult.updated} companies with new field`
      );

      // Example: Transform reviews to add a new field or modify structure
      const reviewResult = await reviewMigrations.transformReviews(
        (review) => ({
          ...review,
          // Add a new field or transform the review structure
          migrated: true,
          processingVersion: toVersion,
        }),
        logger
      );

      results.reviewsUpdated = reviewResult.updated;

      // Return the combined results
      return {
        ...results,
        success: true,
      };
    } catch (error) {
      logger.error("Migration failed", error);
      return {
        ...results,
        success: false,
        error: error.message,
      };
    }
  },
});
