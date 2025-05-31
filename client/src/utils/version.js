/**
 * Version management utility for glass2door client application
 * This module handles version tracking, comparison, and migration requirements
 */

/**
 * Current application version using semantic versioning
 * Format: MAJOR.MINOR.PATCH-LABEL
 * - MAJOR: Breaking changes that require data migration
 * - MINOR: New features, backward compatible
 * - PATCH: Bug fixes, backward compatible
 * - LABEL: Optional label like 'alpha', 'beta', etc.
 */
export const APP_VERSION = "1.0.0-alpha";

/**
 * History of versions with their migration requirements
 * For each version that requires migration, specify:
 * - version: the version string
 * - requiresMigration: whether this version requires migration from previous versions
 * - migrateFrom: array of version strings that can be migrated from
 * - storageKeys: which localStorage keys need migration or deletion
 * - changes: array of changes made in this version (for documentation)
 * - breaking: boolean indicating if this contains breaking changes
 */
export const VERSION_HISTORY = [
  {
    version: "1.0.0-alpha",
    requiresMigration: false, // First version doesn't migrate from anything
    migrateFrom: [],
    storageKeys: [
      // Core data storage
      "companies",
      "app_version",
      // Review cache keys for default companies
      "reviews_1651", // Google
      "reviews_1138", // Apple
      "reviews_1651639", // Microsoft
      "reviews_40772", // Meta
      "reviews_6036", // Amazon
      // UI Settings - ReviewsTable component
      "reviewsTableColumnOrder",
      "reviewsTableColumnVisibility",
      "reviewsTableColumnOrderCompare",
      "reviewsTableColumnVisibilityCompare",
      // UI Settings - SentimentCharts component
      "sentimentChartsOrder",
      "sentimentChartsHidden",
      "sentimentChartsOrderCompare",
      "sentimentChartsHiddenCompare",
    ],
    // Any notes about this version
    notes: "Initial version with version tracking capability",
    changes: [
      "Added version tracking system",
      "Local storage migration framework",
    ],
    breaking: false,
  },
  // Example of how to add future versions:
  // {
  //   version: "1.1.0-alpha",
  //   requiresMigration: true,
  //   migrateFrom: ["1.0.0-alpha"],
  //   storageKeys: ["companies"],
  //   notes: "Updated company data schema",
  //   changes: [
  //     "Added industry categories to companies",
  //     "Added timestamps to company records"
  //   ],
  //   breaking: false
  // },
  // Future versions will be added here as the app evolves
];

/**
 * Parse a version string into its components
 * @param {string} versionStr - Version string (e.g., '1.0.0-alpha')
 * @returns {Object} Parsed version object
 */
export function parseVersion(versionStr) {
  // Match format: MAJOR.MINOR.PATCH-LABEL
  const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);

  if (!match) {
    throw new Error(`Invalid version format: ${versionStr}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    label: match[4] || null,
    raw: versionStr,
  };
}

/**
 * Compare two version strings
 * @param {string} versionA - First version to compare
 * @param {string} versionB - Second version to compare
 * @returns {number} -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 */
export function compareVersions(versionA, versionB) {
  const a = parseVersion(versionA);
  const b = parseVersion(versionB);

  // Compare major.minor.patch numerically
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;

  // If we get here, the numeric parts are equal, so compare labels
  // No label > any label (e.g., 1.0.0 > 1.0.0-alpha)
  if (a.label === null && b.label !== null) return 1;
  if (a.label !== null && b.label === null) return -1;
  if (a.label === b.label) return 0;

  // Both have labels, compare them alphabetically
  return a.label > b.label ? 1 : -1;
}

/**
 * Check if a migration is needed between two versions
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {boolean} Whether migration is needed
 */
export function needsMigration(fromVersion, toVersion) {
  // If versions are the same, no migration is needed
  if (fromVersion === toVersion) return false;

  // If moving to a higher version, check if migration is required
  if (compareVersions(fromVersion, toVersion) < 0) {
    // Find the target version in history
    const targetVersionInfo = VERSION_HISTORY.find(
      (v) => v.version === toVersion
    );
    if (!targetVersionInfo) return false; // Unknown version

    // Check if this version requires migration
    return (
      targetVersionInfo.requiresMigration &&
      targetVersionInfo.migrateFrom.includes(fromVersion)
    );
  }

  // Downgrading is not officially supported, but we'll assume it needs migration
  return true;
}

/**
 * Get migration path between two versions
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {Array} Array of version objects that need migration in sequence
 */
export function getMigrationPath(fromVersion, toVersion) {
  // If the versions are the same, no migration path is needed
  if (fromVersion === toVersion) return [];

  // Sort version history by version (oldest first)
  const sortedVersions = [...VERSION_HISTORY].sort((a, b) =>
    compareVersions(a.version, b.version)
  );

  // Find indices of the from and to versions
  const fromIndex = sortedVersions.findIndex((v) => v.version === fromVersion);
  const toIndex = sortedVersions.findIndex((v) => v.version === toVersion);

  // If either version is not found in history, we can't determine a path
  if (fromIndex === -1 || toIndex === -1) {
    console.error("Cannot find migration path for unknown version");
    return [];
  }

  // Return all versions that require migration between from and to
  return sortedVersions
    .slice(fromIndex + 1, toIndex + 1)
    .filter((v) => v.requiresMigration);
}

/**
 * Get all localStorage keys that should be migrated or deleted
 * when moving from one version to another
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {Array} Array of storage keys that need attention
 */
export function getAffectedStorageKeys(fromVersion, toVersion) {
  const migrationPath = getMigrationPath(fromVersion, toVersion);

  // Collect all unique storage keys mentioned in migrations
  const keys = new Set();
  migrationPath.forEach((version) => {
    if (version.storageKeys && Array.isArray(version.storageKeys)) {
      version.storageKeys.forEach((key) => keys.add(key));
    }
  });

  return Array.from(keys);
}
