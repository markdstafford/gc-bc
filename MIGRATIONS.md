# gc/bc Migration System Guide

This document explains how to use the version tracking and migration system in gc/bc.

## Overview

The version system allows for tracking app versions and performing migrations when the app is updated. This ensures that local storage data remains compatible with new versions of the application.

## Version Format

gc/bc follows semantic versioning:

```
MAJOR.MINOR.PATCH-LABEL
```

- **MAJOR**: Incremented for breaking changes that require data migration
- **MINOR**: Incremented for new features (backward compatible)
- **PATCH**: Incremented for bug fixes (backward compatible)
- **LABEL**: Optional label like 'alpha', 'beta', etc.

## How to Update the Version

1. Update the `APP_VERSION` constant in `/utils/version.js`
2. Add the new version to the `VERSION_HISTORY` array in the same file
3. Implement any necessary migrations

## Adding a New Version

When adding a new version to `VERSION_HISTORY`, include:

```javascript
{
  version: "1.1.0",
  requiresMigration: true,  // Set to true if migration is needed
  migrateFrom: ["1.0.0-alpha"],  // Versions that can be migrated from
  storageKeys: ["companies"],  // Keys affected by this migration
  notes: "Added new company fields",
  changes: [
    "Added industry categories to companies",
    "Enhanced review filtering"
  ],
  breaking: false  // Whether this contains breaking changes
}
```

## Creating a Migration

1. Implement a migration function in `migrations.js`:

```javascript
import { createMigration } from './migrations';
import { LOCAL_STORAGE_KEYS } from './localStorageService';
import { companyMigrations } from './migrationStrategies';

// Add to the migrations registry
export const migrations = {
  '1.1.0': createMigration({
    affects: [LOCAL_STORAGE_KEYS.COMPANIES],
    migrate: async (fromVersion, toVersion, logger) => {
      // Use migration strategies
      const result = await companyMigrations.addField(
        'industry', 
        'Technology',
        logger
      );
      
      return {
        companiesUpdated: result.updated,
        success: true
      };
    }
  }),
  // other migrations...
};
```

2. Use the pre-built migration strategies in `/utils/migrationStrategies.js`

## Migration Strategies

The system provides several pre-built strategies:

### Company Migrations

- `companyMigrations.addField(fieldName, defaultValue, logger)`
- `companyMigrations.renameField(oldName, newName, logger)`
- `companyMigrations.clearAll(logger)`

### Review Migrations

- `reviewMigrations.clearAllCache(logger)`
- `reviewMigrations.transformReviews(transformer, logger)`

### General Storage Migrations

- `generalMigrations.forEachMatchingKey(pattern, handler, logger)`
- `generalMigrations.clearAllStorage(exceptKeys, logger)`

## Best Practices for Migrations

1. **Keep migrations small and targeted** - Each migration should focus on specific changes
2. **Always test migrations thoroughly** - Test both the upgrade and downgrade paths
3. **Include appropriate logging** - Use the logger provided to the migration function
4. **Handle errors gracefully** - Wrap migrations in try/catch blocks
5. **Document changes** - Add notes about what changes were made and why

## Local Storage Inventory

The following localStorage keys are currently used in gc/bc:

### Core Data Storage
- `companies`: Contains all saved company data
- `reviews_{id}`: Reviews cache for a specific company
- `app_version`: Current app version

### UI Settings
- `reviewsTableColumnOrder`: Order of columns in the reviews table (normal mode)
- `reviewsTableColumnVisibility`: Visibility of columns in reviews table (normal mode)
- `reviewsTableColumnOrderCompare`: Order of columns in reviews table (compare mode)
- `reviewsTableColumnVisibilityCompare`: Visibility of columns in reviews table (compare mode)
- `sentimentChartsOrder`: Order of charts in sentiment visualization (normal mode)
- `sentimentChartsHidden`: Hidden charts in sentiment visualization (normal mode) 
- `sentimentChartsOrderCompare`: Order of charts in sentiment visualization (compare mode)
- `sentimentChartsHiddenCompare`: Hidden charts in sentiment visualization (compare mode)

## Initial Migration Plan for 1.0.0-alpha

For the initial release of 1.0.0-alpha, no migrations are needed as this is the first version with version tracking.

In future versions, we may need to consider the following migration scenarios:
1. Changes to the company data structure
2. Updates to cached review formats 
3. Changes to UI settings structure
4. Changes to any other persistently stored data

When implementing migrations, consider:
- Data that can be regenerated (like reviews cache) can be safely dropped
- UI preferences should be preserved when possible, but aren't critical
- Company data is the most important to preserve and migrate carefully

## Example Workflow

When releasing version 1.1.0 with changes to company structure:

1. Update version.js:
   ```javascript
   export const APP_VERSION = '1.1.0';
   
   export const VERSION_HISTORY = [
     // ...existing versions
     {
       version: '1.1.0',
       requiresMigration: true,
       migrateFrom: ['1.0.0-alpha'],
       storageKeys: [LOCAL_STORAGE_KEYS.COMPANIES],
       notes: 'Added industry field to companies',
       changes: ['Added industry categorization'],
       breaking: false
     }
   ];
   ```

2. Create migration in migrations.js:
   ```javascript
   import { companyMigrations } from './migrationStrategies';
   
   export const migrations = {
     // ...existing migrations
     '1.1.0': createMigration({
       affects: [LOCAL_STORAGE_KEYS.COMPANIES],
       migrate: async (fromVersion, toVersion, logger) => {
         return await companyMigrations.addField('industry', 'Technology', logger);
       }
     })
   };
   ```

3. When users update to 1.1.0, the migration will run automatically on app startup.
