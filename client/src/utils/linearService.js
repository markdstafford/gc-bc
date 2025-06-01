import axios from "axios";

// Server API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api/report";

/**
 * Submit a bug report to Linear
 * @param {Object} bugReport Bug report details
 * @param {string} bugReport.title Issue title
 * @param {string} bugReport.description Issue description
 * @param {string} bugReport.priority Priority level (HIGH, MEDIUM, LOW)
 * @returns {Promise<Object>} Created issue data
 */
export const submitBugReport = async (bugReport) => {
  try {
    const { title, description, priority } = bugReport;

    const response = await axios.post(`${API_BASE_URL}/bug`, {
      title,
      description,
      priority,
    });

    return response.data.issue;
  } catch (error) {
    console.error("Failed to submit bug report:", error);
    throw new Error(
      "Failed to create bug report: " + error.response?.data?.error ||
        error.message
    );
  }
};

/**
 * Submit a feature request to Linear
 * @param {Object} featureRequest Feature request details
 * @param {string} featureRequest.title Issue title
 * @param {string} featureRequest.description Issue description
 * @param {string} featureRequest.priority Priority level (HIGH, MEDIUM, LOW)
 * @returns {Promise<Object>} Created issue data
 */
export const submitFeatureRequest = async (featureRequest) => {
  try {
    const { title, description, priority } = featureRequest;

    const response = await axios.post(`${API_BASE_URL}/feature`, {
      title,
      description,
      priority,
    });

    return response.data.issue;
  } catch (error) {
    console.error("Failed to submit feature request:", error);
    throw new Error(
      "Failed to create feature request: " + error.response?.data?.error ||
        error.message
    );
  }
};
