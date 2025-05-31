// Local storage service for managing companies

const COMPANIES_KEY = "companies";

// Get all used localStorage keys in the application
export const LOCAL_STORAGE_KEYS = {
  // Core data storage
  COMPANIES: COMPANIES_KEY,
  APP_VERSION: "app_version",
  // Reviews cache keys follow the pattern: reviews_{glassdoorId}

  // UI Settings - ReviewsTable component
  REVIEWS_TABLE_COLUMN_ORDER: "reviewsTableColumnOrder",
  REVIEWS_TABLE_COLUMN_VISIBILITY: "reviewsTableColumnVisibility",
  REVIEWS_TABLE_COLUMN_ORDER_COMPARE: "reviewsTableColumnOrderCompare",
  REVIEWS_TABLE_COLUMN_VISIBILITY_COMPARE:
    "reviewsTableColumnVisibilityCompare",

  // UI Settings - SentimentCharts component
  SENTIMENT_CHARTS_ORDER: "sentimentChartsOrder",
  SENTIMENT_CHARTS_HIDDEN: "sentimentChartsHidden",
  SENTIMENT_CHARTS_ORDER_COMPARE: "sentimentChartsOrderCompare",
  SENTIMENT_CHARTS_HIDDEN_COMPARE: "sentimentChartsHiddenCompare",
};

// Initialize local storage with default companies if empty
const initializeLocalStorage = () => {
  if (!localStorage.getItem(COMPANIES_KEY)) {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify([]));
  }
};

// Get all companies from local storage
export const getAllCompanies = () => {
  initializeLocalStorage();
  const companies = JSON.parse(localStorage.getItem(COMPANIES_KEY)) || [];
  // Sort companies alphabetically by name
  return companies.sort((a, b) => a.name.localeCompare(b.name));
};

// Add a new company to local storage
export const addCompany = (company) => {
  const companies = getAllCompanies();
  // Check if company with same glassdoorId already exists
  if (companies.some((c) => c.glassdoorId === company.glassdoorId)) {
    return null; // Company already exists
  }

  // Generate a new ID (simple implementation)
  const maxId = companies.reduce((max, c) => Math.max(max, c.id || 0), 0);
  const newCompany = {
    ...company,
    id: maxId + 1,
  };

  companies.push(newCompany);
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  return newCompany;
};

// Update an existing company
export const updateCompany = (id, companyData) => {
  const companies = getAllCompanies();
  const index = companies.findIndex((c) => c.id === id);

  if (index === -1) {
    return null; // Company not found
  }

  const updatedCompany = {
    ...companies[index],
    ...companyData,
    id, // Ensure ID remains the same
  };

  companies[index] = updatedCompany;
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  return updatedCompany;
};

// Delete a company by ID
export const deleteCompany = (id) => {
  const companies = getAllCompanies();
  const filteredCompanies = companies.filter((c) => c.id !== id);

  if (filteredCompanies.length === companies.length) {
    return false; // No company was deleted
  }

  localStorage.setItem(COMPANIES_KEY, JSON.stringify(filteredCompanies));
  return true;
};

// Get a company by ID
export const getCompanyById = (id) => {
  const companies = getAllCompanies();
  return companies.find((c) => c.id === id) || null;
};

// Initialize on load
initializeLocalStorage();
