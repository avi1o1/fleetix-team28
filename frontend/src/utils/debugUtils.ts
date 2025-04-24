/**
 * Utility functions for debugging and diagnostics
 */

/**
 * Log detailed information about an API request
 * @param endpoint - The API endpoint being called
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param data - The data being sent (for POST/PUT)
 */
export const logApiRequest = (endpoint: string, method: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.group(`API ${method} Request to ${endpoint}`);
    console.log('Time:', new Date().toISOString());
    if (data) {
      console.log('Request Data:', data);
      
      // Special handling for date/time fields to help with debugging
      const timeFields = ['shiftStartTime', 'shiftEndTime', 'startTime', 'endTime'];
      const timeData: Record<string, string> = {};
      
      Object.keys(data).forEach(key => {
        if (timeFields.includes(key) && data[key]) {
          timeData[key] = data[key];
        }
      });
      
      if (Object.keys(timeData).length > 0) {
        console.log('Time fields:', timeData);
      }
    }
    console.groupEnd();
  }
};

/**
 * Log detailed information about an API response
 * @param endpoint - The API endpoint that was called
 * @param status - HTTP status code
 * @param data - The response data
 */
export const logApiResponse = (endpoint: string, status: number, data: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.group(`API Response from ${endpoint}`);
    console.log('Status:', status);
    console.log('Response Data:', data);
    console.groupEnd();
  }
};

/**
 * Validate and format a time string to ensure it's in the proper format
 * @param timeStr - Time string to validate/format
 * @returns Formatted time string HH:MM or empty string if invalid
 */
export const validateAndFormatTime = (timeStr: string): string => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  
  // If it's already in HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Try to parse as Date if it's an ISO string
  try {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  } catch (e) {
    console.error('Error parsing time string:', timeStr, e);
  }
  
  return '';
};
