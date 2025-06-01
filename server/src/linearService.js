// Linear API integration service for gc/bc application
import { LinearClient } from "@linear/sdk";

// Create project-specific labels for the issues
const BUG_LABEL = "Bug";
const FEATURE_LABEL = "Feature Request";
const SOURCE_LABEL = "gc/bc";

/**
 * Initialize a Linear client with the provided API key
 * @param {string} apiKey - Personal API key for Linear
 * @returns {LinearClient} Configured Linear client
 */
export const getLinearClient = (apiKey) => {
  if (!apiKey) {
    throw new Error("Linear API key is required");
  }

  return new LinearClient({ apiKey });
};

/**
 * Get all Linear teams available to the current API key
 * @param {string} apiKey - Linear API key
 * @returns {Promise<Array>} List of teams
 */
export const getLinearTeams = async (apiKey) => {
  try {
    if (!apiKey) {
      throw new Error("Linear API key is required");
    }

    const client = getLinearClient(apiKey);
    const teams = await client.teams();

    return teams.nodes.map((team) => ({
      id: team.id,
      name: team.name,
      key: team.key,
    }));
  } catch (error) {
    console.error("Error fetching Linear teams:", error);
    throw error;
  }
};

/**
 * Submit a bug report to Linear
 * @param {Object} bugReport Bug report details
 * @param {string} bugReport.title Issue title
 * @param {string} bugReport.description Issue description
 * @param {string} bugReport.priority Priority level (HIGH, MEDIUM, LOW)
 * @param {string} bugReport.apiKey Linear API key
 * @param {string} bugReport.teamId Linear team ID
 * @returns {Promise<Object>} Created issue data
 */
export const submitBugReport = async (bugReport) => {
  try {
    const { title, description, priority, apiKey, teamId } = bugReport;

    if (!apiKey || !teamId) {
      throw new Error("API Key and Team ID are required");
    }

    const client = getLinearClient(apiKey);

    // Convert priority string to Linear priority level (1-4)
    const priorityMap = {
      HIGH: 1, // Urgent
      MEDIUM: 2, // High
      LOW: 3, // Medium
      // Normal (4) is default
    };

    // Create issue with bug label
    const issueResponse = await client.createIssue({
      title,
      description,
      teamId: teamId,
      priority: priorityMap[priority] || 4,
      labelIds: [], // Will be populated below
    });

    // Get the created issue
    const issue = await issueResponse.issue;
    console.log("Created issue:", issue);
    /*
    // Add labels
    const labels = await client.labels();
    const bugLabel = labels.nodes.find((label) => label.name === BUG_LABEL);
    const sourceLabel = labels.nodes.find(
      (label) => label.name === SOURCE_LABEL
    );

    if (bugLabel) {
      await client.createIssueLabel({
        issueId: issue.id,
        labelId: bugLabel.id,
      });
    }

    if (sourceLabel) {
      await client.createIssueLabel({
        issueId: issue.id,
        labelId: sourceLabel.id,
      });
    }
      */

    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      url: issue.url,
    };
  } catch (error) {
    console.error("Error submitting bug report to Linear:", error);
    throw error;
  }
};

/**
 * Submit a feature request to Linear
 * @param {Object} featureRequest Feature request details
 * @param {string} featureRequest.title Issue title
 * @param {string} featureRequest.description Issue description
 * @param {string} featureRequest.priority Priority level (HIGH, MEDIUM, LOW)
 * @param {string} featureRequest.apiKey Linear API key
 * @param {string} featureRequest.teamId Linear team ID
 * @returns {Promise<Object>} Created issue data
 */
export const submitFeatureRequest = async (featureRequest) => {
  try {
    const { title, description, priority, apiKey, teamId } = featureRequest;

    if (!apiKey || !teamId) {
      throw new Error("API Key and Team ID are required");
    }

    const client = getLinearClient(apiKey);

    // Convert priority string to Linear priority level (1-4)
    const priorityMap = {
      HIGH: 1, // Urgent
      MEDIUM: 2, // High
      LOW: 3, // Medium
      // Normal (4) is default
    };

    // Create issue with feature request label
    const issueResponse = await client.createIssue({
      title,
      description,
      teamId: teamId,
      priority: priorityMap[priority] || 4,
      labelIds: [], // Will be populated below
    });

    // Get the created issue
    const issue = await issueResponse.issue;
    /*
    // Add labels
    const labels = await client.labels();
    const featureLabel = labels.nodes.find(
      (label) => label.name === FEATURE_LABEL
    );
    const sourceLabel = labels.nodes.find(
      (label) => label.name === SOURCE_LABEL
    );

    if (featureLabel) {
      await client.createIssueLabel({
        issueId: issue.id,
        labelId: featureLabel.id,
      });
    }

    if (sourceLabel) {
      await client.createIssueLabel({
        issueId: issue.id,
        labelId: sourceLabel.id,
      });
    }
      */

    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      url: issue.url,
    };
  } catch (error) {
    console.error("Error submitting feature request to Linear:", error);
    throw error;
  }
};
