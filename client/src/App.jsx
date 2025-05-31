import React, { useState, useEffect, useCallback, useMemo } from "react";
import { companyApi, reviewApi } from "./utils/api";
import { CompanySelector } from "./components/CompanySelector";
import { CompanyManagement } from "./components/CompanyManagement";
import { Modal } from "./components/Modal";
import { TimelineChart } from "./components/TimelineChart";
import { SentimentCharts } from "./components/SentimentCharts";
import { ReviewsTable } from "./components/ReviewsTable";
import { ReviewDetails } from "./components/ReviewDetails";
import { CompanyLogo } from "./components/CompanyLogo";
import { VersionNotice } from "./components/VersionNotice";
import { Loader2 } from "lucide-react";
import { subMonths, isAfter, parseISO } from "date-fns";
import { APP_VERSION } from "./utils/version";
import { initializeVersioning } from "./utils/versionService";

function App() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [selectedReviewsByCompany, setSelectedReviewsByCompany] = useState({});
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [timelineRange, setTimelineRange] = useState("year"); // 'year', '6mo', '3mo'
  const [comparedCompanies, setComparedCompanies] = useState([]);
  const [companyReviews, setCompanyReviews] = useState({}); // { [companyId]: reviewsArray }
  const [loadingCompared, setLoadingCompared] = useState({}); // { [companyId]: true/false }
  const [versionStatus, setVersionStatus] = useState(null); // Track version status
  const [versionModalOpen, setVersionModalOpen] = useState(false); // For showing version updates  // Initialize versioning and check for updates on mount
  useEffect(() => {
    const checkVersion = async () => {
      setLoading(true);
      try {
        console.log(`Initializing Glass2Door v${APP_VERSION}`);

        // Initialize versioning system
        const status = await initializeVersioning();
        setVersionStatus(status);

        // Show version notice based on status
        if (status.updated) {
          // Show an update notice for any update, more prominent for migrations
          setVersionModalOpen(true);
          console.log(`Updated from v${status.fromVersion} to v${APP_VERSION}`);

          if (status.migrationResult && !status.migrationResult.success) {
            console.error("Migration failed:", status.migrationResult.message);
          }
        }

        // Load companies after version check
        await loadCompanies();
      } catch (error) {
        console.error("Failed to initialize versioning:", error);
        // Still try to load companies even if version check fails
        await loadCompanies();
      } finally {
        setLoading(false);
      }
    };

    checkVersion();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await companyApi.getAll();
      console.log("Loaded companies from local storage:", data);
      setCompanies(data);
    } catch (error) {
      console.error("Failed to load companies:", error);
    }
  };

  const handleCompanySelect = async (companyId) => {
    console.log("Selected company:", companyId);
    // Store the company ID, not the glassdoorId
    setSelectedCompany(companyId);
    setReviews([]);
    setSelectedReviews([]);
    setDateRange(null);

    if (companyId) {
      setLoading(true);
      setLoadingProgress(null);

      try {
        // Find the selected company to get the glassdoorId for reviews
        const selectedCompany = companies.find(
          (company) => company.id === companyId
        );
        console.log("Found selected company:", selectedCompany);

        if (selectedCompany) {
          console.log(
            "Using glassdoorId for reviews:",
            selectedCompany.glassdoorId
          );
          const allReviews = await reviewApi.fetchAllReviews(
            selectedCompany.glassdoorId,
            (progress) => {
              setLoadingProgress(progress);
            }
          );
          console.log("Received reviews:", allReviews ? allReviews.length : 0);
          setReviews(allReviews);
        } else {
          console.error("Selected company not found:", companyId);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
        setLoadingProgress(null);
      }
    }
  };

  const handleCompanySearch = async (query) => {
    try {
      return await companyApi.search(query);
    } catch (error) {
      console.error("Failed to search companies:", error);
      return [];
    }
  };

  const handleAddCompany = async (
    glassdoorId,
    name,
    logoUrl,
    website,
    size,
    location
  ) => {
    try {
      await companyApi.create(
        glassdoorId,
        name,
        logoUrl,
        website,
        size,
        location
      );
      await loadCompanies();
    } catch (error) {
      console.error("Failed to add company:", error);
    }
  };

  const handleUpdateCompany = async (
    id,
    glassdoorId,
    name,
    logoUrl,
    website,
    size,
    location
  ) => {
    try {
      await companyApi.update(
        id,
        glassdoorId,
        name,
        logoUrl,
        website,
        size,
        location
      );
      await loadCompanies();
    } catch (error) {
      console.error("Failed to update company:", error);
    }
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        await companyApi.delete(id);
        await loadCompanies();
        if (
          companies.find((c) => c.id === id)?.glassdoorId === selectedCompany
        ) {
          setSelectedCompany(null);
          setReviews([]);
        }
      } catch (error) {
        console.error("Failed to delete company:", error);
      }
    }
  };

  const handleBrushChange = useCallback((newDateRange) => {
    setDateRange((prevDateRange) => {
      if (
        prevDateRange?.startMonth !== newDateRange?.startMonth ||
        prevDateRange?.endMonth !== newDateRange?.endMonth
      ) {
        return newDateRange;
      }
      return prevDateRange;
    });
  }, []);

  const handleRowSelect = useCallback((rows) => {
    setSelectedReviews(rows);
  }, []);

  // New handler for company-specific row selection in compare mode
  const handleRowSelectByCompany = useCallback((companyId, rows) => {
    setSelectedReviewsByCompany((prev) => ({
      ...prev,
      [companyId]: rows,
    }));
  }, []);

  // Filter reviews for timeline based on selected range
  const filteredTimelineReviews = useMemo(() => {
    if (!reviews.length) return [];
    let cutoff;
    if (timelineRange === "year") cutoff = subMonths(new Date(), 12);
    else if (timelineRange === "6mo") cutoff = subMonths(new Date(), 6);
    else if (timelineRange === "3mo") cutoff = subMonths(new Date(), 3);
    else return reviews;
    return reviews.filter((r) => isAfter(parseISO(r.reviewDateTime), cutoff));
  }, [reviews, timelineRange]);

  const handleAddCompare = async (company) => {
    if (
      comparedCompanies.length >= 2 ||
      comparedCompanies.some((c) => c.id === company.id) ||
      selectedCompany === company.id
    ) {
      return;
    }
    setComparedCompanies([...comparedCompanies, company]);
    // Fetch reviews for the compared company if not already loaded
    if (!companyReviews[company.id]) {
      setLoadingCompared((lc) => ({ ...lc, [company.id]: true }));
      try {
        // Use glassdoorId to fetch reviews
        const reviews = await reviewApi.fetchAllReviews(company.glassdoorId);
        setCompanyReviews((cr) => ({ ...cr, [company.id]: reviews }));
      } catch (e) {
        setCompanyReviews((cr) => ({ ...cr, [company.id]: [] }));
      } finally {
        setLoadingCompared((lc) => ({ ...lc, [company.id]: false }));
      }
    }
  };

  const handleRemoveCompare = (id) => {
    const newComparedCompanies = comparedCompanies.filter((c) => c.id !== id);
    setComparedCompanies(newComparedCompanies);
  };

  // Build array of companies and their reviews for TimelineChart
  const timelineCompanies = useMemo(() => {
    const primary = companies.find((c) => c.id === selectedCompany);
    const primaryCompanyData = primary
      ? {
          ...primary,
          // Ensure compatibility with old field names
          shortName: primary.name,
          headquarters: primary.location,
          displayName: primary.name,
          reviews: reviews,
          loading: loading,
        }
      : null;

    const comparedCompanyData = comparedCompanies.map((c) => ({
      ...c,
      // Ensure compatibility with old field names
      shortName: c.name,
      headquarters: c.location,
      displayName: c.name,
      reviews: companyReviews[c.id] || [],
      loading: !!loadingCompared[c.id],
    }));

    const result = [];
    if (primaryCompanyData) result.push(primaryCompanyData);
    result.push(...comparedCompanyData);
    return result;
  }, [
    selectedCompany,
    companies,
    reviews,
    loading,
    comparedCompanies,
    companyReviews,
    loadingCompared,
  ]);

  const compareMode = useMemo(
    () => comparedCompanies.length > 0,
    [comparedCompanies]
  );

  // State for active company tab in mobile view
  const [activeCompanyTab, setActiveCompanyTab] = useState(null);
  // State for mobile view detection
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset active tab when companies change
  useEffect(() => {
    // When we enter compare mode, make sure we have an active tab set
    if (compareMode && timelineCompanies.length > 0) {
      // Find the first company with valid data
      const firstValidCompany = timelineCompanies.find(
        (company) => company && company.id
      );
      if (firstValidCompany) {
        setActiveCompanyTab(firstValidCompany.id);
      }
    } else {
      setActiveCompanyTab(null);
    }
  }, [compareMode, timelineCompanies]);

  // Log dateRange whenever it changes
  // (logging removed)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">gc/bc</h1>
          <p className="text-gray-600">
            You deserve a good company; gc/bc will help you find it
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Version {APP_VERSION}
            <button
              className="ml-2 text-blue-500 hover:text-blue-700 hover:underline"
              title="Check for updates"
              onClick={async () => {
                const status = await initializeVersioning();
                setVersionStatus(status);
                setVersionModalOpen(true);
              }}
            >
              ↻
            </button>
          </p>
        </div>

        {/* Show version notice if there's version status and it's either first run or an update */}
        {versionStatus && (versionStatus.firstRun || versionStatus.updated) && (
          <VersionNotice
            versionStatus={versionStatus}
            onClose={() => setVersionModalOpen(false)}
          />
        )}

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <CompanySelector
              companies={companies}
              selectedCompany={selectedCompany}
              comparedCompanies={comparedCompanies}
              onSelect={handleCompanySelect}
              onOpenManagement={() => setIsManagementOpen(true)}
              onAddCompare={handleAddCompare}
              compareLimitReached={comparedCompanies.length >= 2}
            />
          </div>
          {/* Compared companies pills */}
          {comparedCompanies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {comparedCompanies.map((company) => (
                <span
                  key={company.id}
                  className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-base gap-2"
                >
                  <CompanyLogo company={company} size="md" />
                  <button
                    className="ml-2 text-gray-400 hover:text-red-500"
                    onClick={() => handleRemoveCompare(company.id)}
                    aria-label={`Remove ${company.name} from compare`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading reviews...</p>
            {loadingProgress && (
              <p className="text-sm text-gray-500 mt-2">
                Page {loadingProgress.current} of {loadingProgress.total} (
                {loadingProgress.reviewCount} reviews)
              </p>
            )}
          </div>
        )}

        {!loading &&
          selectedCompany &&
          reviews.length === 0 &&
          !compareMode && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No reviews found for this company.
              </p>
            </div>
          )}

        {((selectedCompany && reviews.length > 0) || compareMode) && (
          <div className="space-y-8">
            <TimelineChart
              companies={timelineCompanies}
              compareMode={compareMode}
              onBrushChange={handleBrushChange}
              timelineRange={timelineRange}
              setTimelineRange={setTimelineRange}
            />

            <SentimentCharts
              companies={
                compareMode ? timelineCompanies : [timelineCompanies[0]]
              }
              compareMode={compareMode}
              dateRange={dateRange}
              activeCompanyTab={activeCompanyTab}
              onSelectCompany={setActiveCompanyTab}
            />

            {comparedCompanies.length === 0 ? (
              <>
                <ReviewsTable
                  reviews={reviews}
                  dateRange={dateRange}
                  onRowSelect={handleRowSelect}
                  columnsToShow={["company", "date", "ratingOverall"]}
                  compareMode={compareMode}
                  company={timelineCompanies[0]} // Pass selected company object instead of just ID
                  activeCompanyTab={activeCompanyTab} // Pass active company tab
                  onSelectCompany={setActiveCompanyTab} // Pass the callback to change active tab
                />
                {selectedReviews.length > 0 && (
                  <ReviewDetails reviews={selectedReviews} />
                )}
              </>
            ) : // In mobile compare mode, only show the active company's table
            isMobile ? (
              <div className="space-y-6">
                <ReviewsTable
                  reviews={
                    timelineCompanies.find((c) => c.id === activeCompanyTab)
                      ?.reviews || []
                  }
                  dateRange={dateRange}
                  onRowSelect={(selectedRows) =>
                    handleRowSelectByCompany(activeCompanyTab, selectedRows)
                  }
                  columnsToShow={["company", "date", "ratingOverall"]}
                  compareMode={compareMode}
                  company={timelineCompanies} // Pass all companies for the toggle
                  activeCompanyTab={activeCompanyTab} // Pass active company tab
                  onSelectCompany={setActiveCompanyTab} // Pass the callback to change active tab
                />
                {selectedReviewsByCompany[activeCompanyTab]?.length > 0 && (
                  <ReviewDetails
                    reviews={selectedReviewsByCompany[activeCompanyTab]}
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {timelineCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CompanyLogo
                        company={company}
                        size="md"
                        className="font-semibold"
                      />
                    </div>
                    <div className="space-y-6">
                      <ReviewsTable
                        reviews={company.reviews}
                        dateRange={dateRange}
                        onRowSelect={(selectedRows) =>
                          handleRowSelectByCompany(company.id, selectedRows)
                        }
                        columnsToShow={["company", "date", "ratingOverall"]}
                        compareMode={compareMode}
                        company={company} // Pass company data
                      />
                      {selectedReviewsByCompany[company.id]?.length > 0 && (
                        <ReviewDetails
                          reviews={selectedReviewsByCompany[company.id]}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        title="Manage Companies"
      >
        <CompanyManagement
          companies={companies}
          onAdd={handleAddCompany}
          onUpdate={handleUpdateCompany}
          onDelete={handleDeleteCompany}
          onSearch={handleCompanySearch}
        />
      </Modal>
    </div>
  );
}

export default App;
