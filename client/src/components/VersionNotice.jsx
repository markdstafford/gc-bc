import React, { useState } from "react";
import { APP_VERSION, VERSION_HISTORY } from "../utils/version";

/**
 * Component that displays a notice about the app version and recent changes
 *
 * @param {Object} props - Component props
 * @param {Object} props.versionStatus - Version status information
 * @param {Function} props.onClose - Function called when the notice is dismissed
 */
export function VersionNotice({ versionStatus, onClose }) {
  if (!versionStatus) return null;

  const { firstRun, updated, fromVersion, migrationResult } = versionStatus;
  const [showChanges, setShowChanges] = useState(false);

  // Get the current version info
  const currentVersionInfo = VERSION_HISTORY.find(
    (v) => v.version === APP_VERSION
  ) || {
    changes: [],
    notes: "Release notes not available",
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-blue-800">
                {firstRun
                  ? `Welcome to Glass2Door v${APP_VERSION}`
                  : `Updated to v${APP_VERSION}`}
              </h3>
              {updated &&
                currentVersionInfo.changes &&
                currentVersionInfo.changes.length > 0 && (
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setShowChanges(!showChanges)}
                  >
                    {showChanges ? "Hide changes" : "Show changes"}
                  </button>
                )}
            </div>
            <div className="mt-2 text-sm text-blue-700">
              {firstRun ? (
                <p>
                  Thank you for using Glass2Door! This application helps you
                  analyze and visualize company reviews from Glassdoor.
                </p>
              ) : updated ? (
                <div>
                  <p>
                    Glass2Door has been updated from v{fromVersion} to v
                    {APP_VERSION}.
                  </p>
                  {migrationResult && (
                    <div className="mt-1">
                      {migrationResult.success ? (
                        <>
                          <p>
                            All your data has been successfully migrated to the
                            new version.
                          </p>
                          {migrationResult.affectedKeys &&
                            migrationResult.affectedKeys.length > 0 && (
                              <p className="text-xs mt-1">
                                <span className="font-medium">
                                  Updated data:
                                </span>{" "}
                                {migrationResult.affectedKeys.join(", ")}
                              </p>
                            )}
                        </>
                      ) : (
                        <p className="text-red-600">
                          There was an issue migrating your data. Some features
                          may not work correctly.
                          {migrationResult.message && (
                            <span className="block text-xs mt-1">
                              {migrationResult.message}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p>You're running the latest version of Glass2Door.</p>
              )}

              {/* Show version changes when expanded */}
              {showChanges &&
                currentVersionInfo.changes &&
                currentVersionInfo.changes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <h4 className="text-xs font-semibold text-blue-700 mb-2">
                      What's New in v{APP_VERSION}
                    </h4>
                    <ul className="text-xs text-blue-700 list-disc ml-4 space-y-1">
                      {currentVersionInfo.changes.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>

                    {currentVersionInfo.breaking && (
                      <div className="mt-2 text-xs text-red-600 font-medium">
                        ⚠️ This update includes breaking changes that required
                        data migration.
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-3 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            onClick={onClose}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
