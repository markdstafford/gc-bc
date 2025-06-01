import React from "react";
import { reviewCacheHelpers } from "../utils/migrations";
import { LOCAL_STORAGE_KEYS } from "../utils/localStorageService";
import { VERSION_HISTORY } from "../utils/version";

export function UserGuidance() {
  const handleDeleteData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all your local data? This will remove all saved companies, reviews, and settings. This action cannot be undone."
      )
    ) {
      // Clear all localStorage
      localStorage.clear();
      alert("All data has been cleared. The page will now reload.");
      window.location.reload();
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto px-1">
      <h2 className="text-2xl font-bold mb-4">How to use gc/bc</h2>
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-2">Getting started</h3>
          <p className="mb-2">
            gc/bc helps you analyze and compare company reviews from Glassdoor.
            Here's how to get started:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Select a company from the dropdown at the top of the page or add a
              new one
            </li>
            <li>
              View the company reviews data in the timeline and sentiment charts
            </li>
            <li>
              Compare up to two companies side by side to make better career
              decisions
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Data storage</h3>
          <p className="mb-2">
            gc/bc is a client-side application that stores all data in your
            browser's localStorage:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>
              All company data and review caches are stored locally on your
              device
            </li>
            <li>
              No information is sent to any server except to fetch reviews from
              Glassdoor
            </li>
            <li>
              Your data persists between sessions but is limited to this browser
            </li>
            <li>
              Clearing browser data or using private/incognito mode will result
              in data loss
            </li>
          </ul>
          <div className="mt-4 text-center">
            <button
              onClick={handleDeleteData}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              Delete data
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This will remove all your companies, saved reviews, and settings
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Adding companies</h3>
          <p className="mb-2">To add a new company:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Click "Manage" next to the company selector</li>
            <li>In the management modal, click "Add New Company"</li>
            <li>Search for a company by name</li>
            <li>Click on a search result to add it to your collection</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Viewing reviews</h3>
          <p className="mb-2">Once you've selected a company:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>The timeline chart shows rating trends over time</li>
            <li>
              Use the time range selector (year, 6mo, 3mo) to zoom in on recent
              data
            </li>
            <li>Click and drag on the timeline to filter reviews by date</li>
            <li>View individual reviews in the table below the charts</li>
            <li>
              Click on a review to see full details including pros, cons and
              advice
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            Using the reviews table
          </h3>
          <p className="mb-2">Get the most out of the reviews table:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Filtering reviews</strong>: Click the filter icon to add
              filters by date, rating, sentiment, or content
            </li>
            <li>
              <strong>Sorting</strong>: Click column headers to sort reviews by
              that column
            </li>
            <li>
              <strong>Selecting reviews</strong>: Click on any review to select
              it; details will appear in the cards below the table
            </li>
            <li>
              <strong>Multiple selection</strong>: Hold Shift or Ctrl/Cmd to
              select multiple reviews at once
            </li>
            <li>
              <strong>Export data</strong>: Use the download icon to export
              selected reviews (or all reviews if none selected) to CSV
            </li>
            <li>
              <strong>Customize columns</strong>: Click the settings icon to
              show/hide columns or rearrange them by dragging
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Company comparison</h3>
          <p className="mb-2">To compare companies:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Select your primary company first</li>
            <li>
              Click the "Compare" button and select up to two additional
              companies
            </li>
            <li>View side-by-side sentiment analysis and reviews</li>
            <li>
              Remove a company from comparison by clicking the "×" on its label
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Submitting feedback</h3>
          <p className="mb-2">
            You can submit bug reports and feature requests directly to our
            development team:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Click the feedback button in the bottom-right corner of the screen
            </li>
            <li>Choose between submitting a bug report or feature request</li>
            <li>Fill in the details of your feedback</li>
            <li>Set a priority level for your request</li>
            <li>Submit the form</li>
          </ol>
        </section>
      </div>
      {/* Version history section */}
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Version history</h3>
        <div className="space-y-6">
          {VERSION_HISTORY.map((v) => (
            <div
              key={v.version}
              className="border border-gray-200 rounded p-4 bg-gray-50"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-base font-bold text-blue-700">
                  v{v.version}
                </span>
                {v.breaking && (
                  <span className="text-xs text-red-600 font-semibold ml-2">
                    Breaking
                  </span>
                )}
              </div>
              {v.notes && (
                <div className="text-xs text-gray-600 mb-2">{v.notes}</div>
              )}
              {v.changes && v.changes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    What's new:
                  </div>
                  <ul className="list-disc ml-5 text-xs text-gray-700 space-y-1">
                    {v.changes.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
