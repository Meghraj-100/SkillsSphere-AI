import { apiRequest } from "../../../services/apiClient";

/**
 * Fetch jobs with optional filters
 * @param {Object} filters - Filter parameters
 * @param {string} token - Auth token
 * @returns {Promise<Object>} - API response
 */
export const getJobs = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  
  if (filters.designation) queryParams.append("designation", filters.designation);
  if (filters.minSalary) queryParams.append("minSalary", filters.minSalary);
  if (filters.maxSalary) queryParams.append("maxSalary", filters.maxSalary);
  if (filters.postedWithin) queryParams.append("postedWithin", filters.postedWithin);

  const queryString = queryParams.toString();
  const path = `/api/jobs${queryString ? `?${queryString}` : ""}`;

  return apiRequest(path, { token });
};

/**
 * Apply to a job posting
 * @param {string} jobId - Job ID
 * @param {string} token - Auth token
 * @param {Object} options - Optional fields (resumeId, coverNote)
 * @returns {Promise<Object>} - API response
 */
export const applyToJob = async (jobId, token, options = {}) => {
  return apiRequest(`/api/jobs/${jobId}/apply`, {
    method: "POST",
    body: options,
    token,
  });
};
