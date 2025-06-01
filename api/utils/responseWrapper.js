// utils/responseWrapper.js
// Standard response format wrapper for all API endpoints

/**
 * Standard API response format:
 * {
 *   success: boolean,
 *   data?: any,
 *   message?: string,
 *   error?: string,
 *   pagination?: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     pages: number
 *   }
 * }
 */

const sendSuccess = (res, data = null, message = null, pagination = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(data !== null && { data }),
    ...(message && { message }),
    ...(pagination && { pagination })
  };
  
  res.status(statusCode).json(response);
};

const sendError = (res, error, statusCode = 400, details = null) => {
  const response = {
    success: false,
    error,
    ...(details && { details })
  };
  
  res.status(statusCode).json(response);
};

const sendPaginatedData = (res, data, paginationInfo, message = null) => {
  const standardPagination = {
    page: paginationInfo.current_page || Math.floor((paginationInfo.offset || 0) / (paginationInfo.limit || 10)) + 1,
    limit: paginationInfo.limit || 10,
    total: paginationInfo.total_items || paginationInfo.total || 0,
    pages: paginationInfo.total_pages || Math.ceil((paginationInfo.total_items || 0) / (paginationInfo.limit || 10))
  };
  
  sendSuccess(res, data, message, standardPagination);
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedData
};