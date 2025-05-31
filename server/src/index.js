import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Get authentication headers from environment variables
const getAuthHeaders = () => {
  const cookies = process.env.GLASSDOOR_COOKIES;
  const csrfToken = process.env.GLASSDOOR_CSRF_TOKEN;

  if (!cookies || !csrfToken) {
    throw new Error(
      "Missing required environment variables: GLASSDOOR_COOKIES and GLASSDOOR_CSRF_TOKEN"
    );
  }

  return {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Cookie: cookies,
    "gd-csrf-token": csrfToken,
  };
};

// Company search endpoint
app.post("/api/companies/search", async (req, res) => {
  const { query } = req.body;

  console.log("=== COMPANY SEARCH REQUEST ===");
  console.log("Search query:", query);

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  // Use the provided GraphQL query
  const searchQuery = `query AllResultsCompanySearch(
    $jobTitle: String,
    $employerName: String,
    $locationId: Int,
    $locationType: String,
    $numPerPage: Int,
    $context: Context
  ) {
    employerNameCompaniesData: employerSearch(
      employerName: $employerName
      location: {locationId: $locationId, locationType: $locationType}
      numPerPage: $numPerPage
      context: $context
      sortOrder: MOSTRELEVANT
    ) {
      ...CompanySearchResult
      __typename
    }
    directHitCompany: employerSearch(
      filterDirectHit: true
      employerName: $employerName
      location: {locationId: $locationId, locationType: $locationType}
      context: $context
      sortOrder: MOSTRELEVANT
    ) {
      ...CompanySearchResult
      __typename
    }
    jobTitleCompaniesData: employerSearch(
      jobTitle: $jobTitle
      location: {locationId: $locationId, locationType: $locationType}
      numPerPage: $numPerPage
      context: $context
      sortOrder: MOSTRELEVANT
    ) {
      ...CompanySearchResult
      __typename
    }
  }

  fragment CompanySearchResult on UgcSearchV2EmployerResult {
    employer {
      id
      shortName
      squareLogoUrl
      website
      headquarters
      size
      sizeCategory
      overview {
        description
        __typename
      }
      primaryIndustry {
        industryId
        industryName
        __typename
      }
      links {
        overviewUrl
        __typename
      }
      counts {
        reviewCount
        salaryCount
        globalJobCount {
          jobCount
          __typename
        }
        __typename
      }
      __typename
    }
    employerRatings {
      overallRating
      __typename
    }
    __typename
  }`;

  const variables = {
    context: { domain: "glassdoor.com" },
    employerName: query,
    jobTitle: null,
    locationId: 1,
    locationType: "",
    numPerPage: 10,
  };

  try {
    const response = await axios.post(
      "https://www.glassdoor.com/graph",
      {
        query: searchQuery,
        variables: variables,
      },
      {
        headers: getAuthHeaders(),
      }
    );

    // Combine results from all three sections
    const allResults = [
      ...(response.data?.data?.employerNameCompaniesData || []),
      ...(response.data?.data?.directHitCompany || []),
      ...(response.data?.data?.jobTitleCompaniesData || []),
    ];

    // Deduplicate by employer.id
    const seen = new Set();
    const formattedResults = allResults
      .filter(
        (result) =>
          result &&
          result.employer &&
          !seen.has(result.employer.id) &&
          seen.add(result.employer.id)
      )
      .map((result) => ({
        id: result.employer.id,
        shortName: result.employer.shortName,
        logoUrl:
          result.employer.squareLogoUrl || result.employer.logoUrl || null,
        website: result.employer.website || null,
        size: result.employer.size || null,
        location: result.employer.headquarters || null,
      }));

    res.json(formattedResults);
  } catch (error) {
    console.error("=== ERROR IN COMPANY SEARCH ===");
    console.error("Error message:", error.message);
    console.error("Error response status:", error.response?.status);
    console.error(
      "Error response data:",
      JSON.stringify(error.response?.data, null, 2)
    );
    console.error("Full error:", error);
    console.error("=== END ERROR ===");

    res.status(500).json({
      error: "Failed to search companies",
      details: error.response?.data || error.message,
    });
  }
});

// Company search endpoint with enhanced data
app.post("/api/companies/search-enhanced", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  // First, get the basic search results
  const searchQuery = `query EmployerSearch($employerSearchRangeFilters: [EmployerSearchRangeFilter], $industries: [IndustryIdent], $jobTitle: String, $location: UgcSearchV2LocationIdent, $pageRequested: Int, $preferredTldId: Int, $sGocIds: [Int], $sectors: [SectorIdent], $employerName: String) {
  employerSearchV2(
    employerSearchRangeFilters: $employerSearchRangeFilters
    industries: $industries
    jobTitle: $jobTitle
    location: $location
    pageRequested: $pageRequested
    preferredTldId: $preferredTldId
    sGocIds: $sGocIds
    sectors: $sectors
    employerName: $employerName
  ) {
    employerResults {
      employer {
        bestProfile {
          id
          __typename
        }
        id
        shortName
        ratings {
          overallRating
          careerOpportunitiesRating
          compensationAndBenefitsRating
          cultureAndValuesRating
          diversityAndInclusionRating
          seniorManagementRating
          workLifeBalanceRating
          __typename
        }
        __typename
      }
      __typename
    }
    numOfPagesAvailable
    numOfRecordsAvailable
    __typename
  }
}`;

  const variables = {
    employerSearchRangeFilters: [],
    pageRequested: 1,
    industries: [],
    sectors: [],
    jobTitle: "",
    sGocIds: [],
    employerName: query,
  };

  try {
    console.log("Making search request to Glassdoor API...");
    const searchResponse = await axios.post(
      "https://www.glassdoor.com/graph",
      {
        query: searchQuery,
        variables: variables,
      },
      {
        headers: getAuthHeaders(),
      }
    );

    const results =
      searchResponse.data?.data?.employerSearchV2?.employerResults || [];
    console.log("Search results count:", results.length);

    // Now try to get additional info for each company by fetching a small sample of reviews
    const enhancedResults = await Promise.all(
      results.slice(0, 5).map(async (result) => {
        // Limit to first 5 to avoid too many requests
        try {
          console.log(
            `Fetching sample reviews for company ${result.employer.id}...`
          );

          const reviewQuery = `
            query GetEmployerReviews($page: Int!) {
              employerReviews: employerReviewsRG(
                employerReviewsInput: {
                  applyDefaultCriteria: false
                  dynamicProfileId: 188585
                  employer: { id: ${result.employer.id} }
                  employmentStatuses: [REGULAR,PART_TIME]
                  onlyCurrentEmployees: false
                  goc: null
                  isRowProfileEnabled: null
                  jobTitle: null
                  language: "eng"
                  languageOverrides: null
                  location: null
                  overallRating: null
                  page: { num: $page, size: 1 }
                  preferredTldId: 0
                  reviewCategories: []
                  sort: DATE
                  textSearch: ""
                  useRowProfileTldForRatings: false
                  worldwideFilter: false
                }
              ) {
                allReviewsCount
                reviews {
                  reviewId
                }
              }
            }
          `;

          const reviewResponse = await axios.post(
            "https://www.glassdoor.com/graph",
            {
              query: reviewQuery,
              variables: { page: 1 },
            },
            {
              headers: getAuthHeaders(),
            }
          );

          const reviewCount =
            reviewResponse.data?.data?.employerReviews?.allReviewsCount || 0;

          return {
            id: result.employer.id,
            shortName: result.employer.shortName,
            logoUrl: result.employer.bestProfile?.squareLogoUrl || null,
            ratings: result.employer.ratings,
            reviewCount: reviewCount,
          };
        } catch (error) {
          console.error(
            `Error fetching reviews for company ${result.employer.id}:`,
            error.message
          );
          return {
            id: result.employer.id,
            shortName: result.employer.shortName,
            logoUrl: result.employer.bestProfile?.squareLogoUrl || null,
            ratings: result.employer.ratings,
            reviewCount: 0,
          };
        }
      })
    );

    console.log("Enhanced results:", JSON.stringify(enhancedResults, null, 2));
    console.log("=== END ENHANCED COMPANY SEARCH ===");

    res.json(enhancedResults);
  } catch (error) {
    console.error("=== ERROR IN ENHANCED COMPANY SEARCH ===");
    console.error("Error message:", error.message);
    console.error("Error response status:", error.response?.status);
    console.error(
      "Error response data:",
      JSON.stringify(error.response?.data, null, 2)
    );
    console.error("Full error:", error);
    console.error("=== END ERROR ===");

    res.status(500).json({
      error: "Failed to search companies",
      details: error.response?.data || error.message,
    });
  }
});

// GraphQL endpoint for fetching reviews
app.post("/api/reviews", async (req, res) => {
  const { employerId, page = 1 } = req.body;

  if (!employerId) {
    return res.status(400).json({ error: "employerId is required" });
  }

  try {
    const query = `
    query GetEmployerReviews($page: Int!) {
      employerReviews: employerReviewsRG(
        employerReviewsInput: {
          applyDefaultCriteria: false
          dynamicProfileId: 188585
          employer: { id: ${employerId} }
          employmentStatuses: [REGULAR,PART_TIME]
          onlyCurrentEmployees: false
          goc: null
          isRowProfileEnabled: null
          jobTitle: null
          language: "eng"
          languageOverrides: null
          location: null
          overallRating: null
          page: { num: $page, size: 100 }
          preferredTldId: 0
          reviewCategories: []
          sort: DATE
          textSearch: ""
          useRowProfileTldForRatings: false
          worldwideFilter: false
        }
      ) {
        allReviewsCount
        currentPage
        filteredReviewsCount
        numberOfPages
        ratedReviewsCount
        reviews {
          advice
          cons
          employmentStatus
          featured
          isCurrentJob
          jobTitle {
            title: text
          }
          languageId
          lengthOfEmployment
          pros
          ratingBusinessOutlook
          ratingCareerOpportunities
          ratingCeo
          ratingCompensationAndBenefits
          ratingCultureAndValues
          ratingDiversityAndInclusion
          ratingOverall
          ratingRecommendToFriend
          ratingSeniorLeadership
          ratingWorkLifeBalance
          reviewDateTime
          reviewId
          summary
        }
      }
    }
  `;

    const response = await axios.post(
      "https://www.glassdoor.com/graph",
      {
        query,
        variables: { page },
      },
      {
        headers: getAuthHeaders(),
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).json({
      error: "Failed to fetch reviews",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
