// Backend API configuration
// TODO: Update this URL to your actual Spring Boot backend URL
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080/api' // Development
  : 'https://your-production-api.com/api'; // Production

// Request timeout in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// Additional API configuration
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
};
