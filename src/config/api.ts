// Backend API configuration
// TODO: Update this URL to your actual Spring Boot backend URL
export const API_BASE_URL = __DEV__ 
  ? 'https://raspberrypi.tail6b11e4.ts.net' // Development http://localhost:8080/api
  : 'https://raspberrypi.tail6b11e4.ts.net'; // Production 

// Request timeout in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// Additional API configuration
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
};
