import axios from "axios";
import {
  getAllCompanies,
  addCompany as addCompanyToStorage,
  updateCompany as updateCompanyInStorage,
  deleteCompany as deleteCompanyFromStorage,
  getCompanyById,
} from "./localStorageService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
});

export default api;

export const companyApi = {
  getAll: async () => {
    // Get companies from local storage
    return getAllCompanies();
  },

  search: async (query) => {
    // First search in local storage
    const companies = getAllCompanies();
    const normalizedQuery = query.toLowerCase();
    const localResults = companies.filter(
      (company) =>
        company.name?.toLowerCase().includes(normalizedQuery) ||
        company.location?.toLowerCase().includes(normalizedQuery)
    );

    try {
      // Then make a network request to search for external companies
      console.log("Searching for external companies:", query);
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await axios.post(`${baseUrl}/api/companies/search`, {
        query,
      });
      console.log("External company search results:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("Failed to search for external companies:", error);
      // Fall back to local results if the request fails
      return localResults;
    }
  },

  create: async (glassdoorId, name, logoUrl, website, size, location) => {
    // Add to local storage instead of sending to server
    return addCompanyToStorage({
      glassdoorId,
      name,
      logoUrl,
      website,
      size,
      location,
    });
  },

  update: async (id, glassdoorId, name, logoUrl, website, size, location) => {
    // Update in local storage
    return updateCompanyInStorage(id, {
      glassdoorId,
      name,
      logoUrl,
      website,
      size,
      location,
    });
  },

  delete: async (id) => {
    // Delete from local storage
    return deleteCompanyFromStorage(id);
  },
};

export const reviewApi = {
  fetchReviews: async (employerId, page = 1) => {
    // Make real API calls to fetch reviews
    if (!employerId) {
      console.error("No employerId provided to fetchReviews");
      throw new Error("No employerId provided");
    }

    // Ensure we're using the glassdoor ID, not the local database ID
    // The server expects numeric IDs, so remove any quotes
    const numericEmployerId = parseInt(employerId, 10) || employerId;
    console.log(
      `Fetching reviews for employerId: ${numericEmployerId} (original: ${employerId}), page: ${page}`
    );

    try {
      // Try using a direct URL instead of the api instance
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const url = `${baseUrl}/api/reviews`;
      console.log("Making API request to:", url);

      const response = await axios.post(url, {
        employerId: numericEmployerId,
        page,
      });
      console.log("Reviews API response received:", response.status);
      return response.data;
    } catch (error) {
      console.error("Error in fetchReviews:", error.message);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  fetchAllReviews: async (employerId, onProgress) => {
    // Client-side cache key
    const cacheKey = `reviews_${employerId}`;
    const cacheRaw = localStorage.getItem(cacheKey);
    if (cacheRaw) {
      try {
        const cache = JSON.parse(cacheRaw);
        if (
          cache.timestamp &&
          Date.now() - cache.timestamp < 24 * 60 * 60 * 1000 &&
          Array.isArray(cache.reviews)
        ) {
          return cache.reviews;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Make real API calls to fetch all reviews
    let allReviews = [];
    let currentPage = 1;
    let totalPages = 1;

    console.log(`Starting to fetch reviews for employerId: ${employerId}`);

    // Fetch all pages of reviews
    try {
      // First request to get the initial page and determine total pages
      console.log(`Fetching page ${currentPage} of reviews`);
      const firstResponse = await reviewApi.fetchReviews(
        employerId,
        currentPage
      );
      console.log("API response for first page:", firstResponse);

      const firstData = firstResponse.data?.employerReviews;
      if (firstData) {
        console.log(
          `Found ${
            firstData.reviews?.length || 0
          } reviews on page ${currentPage}`
        );
        allReviews = [...allReviews, ...(firstData.reviews || [])];
        totalPages = firstData.numberOfPages || 1;
        console.log(`Total pages: ${totalPages}`);

        if (onProgress) {
          onProgress({
            current: currentPage,
            total: totalPages,
            reviewCount: allReviews.length,
          });
        }

        // Fetch remaining pages if there are more
        currentPage++;
        while (currentPage <= totalPages) {
          console.log(`Fetching page ${currentPage} of ${totalPages}`);
          const response = await reviewApi.fetchReviews(
            employerId,
            currentPage
          );
          const data = response.data?.employerReviews;

          if (data && data.reviews) {
            console.log(
              `Found ${data.reviews.length || 0} reviews on page ${currentPage}`
            );
            allReviews = [...allReviews, ...(data.reviews || [])];

            if (onProgress) {
              onProgress({
                current: currentPage,
                total: totalPages,
                reviewCount: allReviews.length,
              });
            }
          }

          currentPage++;
        }
      } else {
        console.error("No data or reviews in API response");
      }
    } catch (error) {
      console.error(`Error fetching reviews:`, error);
    }

    // Store in cache
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ reviews: allReviews, timestamp: Date.now() })
      );
    } catch (e) {
      // Ignore quota errors
    }

    return allReviews;
  },
};
