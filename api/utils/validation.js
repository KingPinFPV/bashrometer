// utils/validation.js
// Centralized validation utilities

/**
 * Validates and converts string to integer
 * @param {any} value - Value to convert
 * @param {string} fieldName - Field name for error messages
 * @param {boolean} required - Whether field is required
 * @returns {number|null} - Parsed integer or null
 * @throws {Error} - If validation fails
 */
const validateInteger = (value, fieldName, required = false) => {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid integer`);
  }
  
  return parsed;
};

/**
 * Validates and converts string to float
 * @param {any} value - Value to convert
 * @param {string} fieldName - Field name for error messages
 * @param {boolean} required - Whether field is required
 * @param {number} min - Minimum value (optional)
 * @returns {number|null} - Parsed float or null
 * @throws {Error} - If validation fails
 */
const validateFloat = (value, fieldName, required = false, min = null) => {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }
  
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  
  if (min !== null && parsed < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  
  return parsed;
};

/**
 * Validates and sanitizes string
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {boolean} required - Whether field is required
 * @param {number} maxLength - Maximum length (optional)
 * @returns {string|null} - Trimmed string or null
 * @throws {Error} - If validation fails
 */
const validateString = (value, fieldName, required = false, maxLength = null) => {
  if (value === null || value === undefined) {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }
  
  const trimmed = String(value).trim();
  
  if (trimmed === '' && required) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  
  if (trimmed === '') {
    return null;
  }
  
  if (maxLength !== null && trimmed.length > maxLength) {
    throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
  }
  
  return trimmed;
};

/**
 * Validates boolean value
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {boolean} defaultValue - Default value if not provided
 * @returns {boolean} - Boolean value
 */
const validateBoolean = (value, fieldName, defaultValue = false) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return defaultValue;
};

/**
 * Validates enum value
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Array} allowedValues - Array of allowed values
 * @param {boolean} required - Whether field is required
 * @returns {any|null} - Valid value or null
 * @throws {Error} - If validation fails
 */
const validateEnum = (value, fieldName, allowedValues, required = false) => {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }
  
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  
  return value;
};

/**
 * Validates pagination parameters
 * @param {object} query - Query parameters
 * @returns {object} - Validated pagination params
 */
const validatePagination = (query) => {
  const limit = validateInteger(query.limit, 'limit', false) || 10;
  const offset = validateInteger(query.offset, 'offset', false) || 0;
  
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  if (offset < 0) {
    throw new Error('Offset must be non-negative');
  }
  
  return { limit, offset };
};

/**
 * Validates product data
 * @param {object} data - Product data to validate
 * @returns {object} - Validated product data
 */
const validateProductData = (data) => {
  return {
    name: validateString(data.name, 'Product name', true, 255),
    brand: validateString(data.brand, 'Brand', false, 100),
    category: validateString(data.category, 'Category', false, 100),
    cut_id: validateInteger(data.cut_id, 'Cut ID', false),
    product_subtype_id: validateInteger(data.product_subtype_id, 'Product subtype ID', false),
    unit_of_measure: validateEnum(data.unit_of_measure, 'Unit of measure', 
      ['kg', '100g', 'g', 'unit', 'package'], false),
    description: validateString(data.description, 'Description', false, 1000),
    short_description: validateString(data.short_description, 'Short description', false, 255),
    default_weight_per_unit_grams: validateFloat(data.default_weight_per_unit_grams, 
      'Default weight per unit grams', false, 0),
    is_active: validateBoolean(data.is_active, 'Is active', true)
  };
};

/**
 * Validates price data
 * @param {object} data - Price data to validate
 * @returns {object} - Validated price data
 */
const validatePriceData = (data) => {
  const validated = {
    product_id: validateInteger(data.product_id, 'Product ID', false),
    retailer_id: validateInteger(data.retailer_id, 'Retailer ID', false),
    regular_price: validateFloat(data.regular_price, 'Regular price', true, 0.01),
    sale_price: validateFloat(data.sale_price, 'Sale price', false, 0.01),
    is_on_sale: validateBoolean(data.is_on_sale, 'Is on sale', false),
    quantity_for_price: validateFloat(data.quantity_for_price, 'Quantity for price', false, 0.01),
    unit_for_price: validateEnum(data.unit_for_price, 'Unit for price', 
      ['kg', '100g', 'g', 'unit', 'package'], false),
    notes: validateString(data.notes, 'Notes', false, 500)
  };
  
  // If product names are provided instead of IDs, validate them
  if (!validated.product_id && data.product_name) {
    validated.product_name = validateString(data.product_name, 'Product name', true, 255);
  }
  
  if (!validated.retailer_id && data.retailer_name) {
    validated.retailer_name = validateString(data.retailer_name, 'Retailer name', true, 255);
  }
  
  return validated;
};

/**
 * Validates retailer data
 * @param {object} data - Retailer data to validate
 * @returns {object} - Validated retailer data
 */
const validateRetailerData = (data) => {
  return {
    name: validateString(data.name, 'Retailer name', true, 255),
    chain: validateString(data.chain, 'Chain', false, 100),
    address: validateString(data.address || data.location, 'Address', false, 500),
    type: validateString(data.type, 'Type', false, 100),
    geo_lat: validateFloat(data.geo_lat, 'Latitude', false),
    geo_lon: validateFloat(data.geo_lon, 'Longitude', false),
    opening_hours: validateString(data.opening_hours, 'Opening hours', false, 255),
    phone: validateString(data.phone, 'Phone', false, 50),
    website: validateString(data.website, 'Website', false, 255),
    notes: validateString(data.notes, 'Notes', false, 1000),
    is_active: validateBoolean(data.is_active, 'Is active', true)
  };
};

module.exports = {
  validateInteger,
  validateFloat,
  validateString,
  validateBoolean,
  validateEnum,
  validatePagination,
  validateProductData,
  validatePriceData,
  validateRetailerData
};