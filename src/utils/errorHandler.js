import toast from 'react-hot-toast';

export const handleApiError = (err, customMessage = null) => {
  let errorMessage = customMessage || 'An unexpected error occurred. Please try again.';
  
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    // Handle Rate Limiting (429)
    if (status === 429) {
      const waitTime = data.wait_time || err.response.headers['retry-after'];
      errorMessage = `Too many requests. Please try again in ${waitTime ? waitTime + ' seconds' : 'a moment'}.`;
    }
    // Handle Unauthorized (401)
    else if (status === 401) {
      errorMessage = data.detail || data.message || 'Session expired or unauthorized. Please log in again.';
    }
    // Handle Forbidden (403)
    else if (status === 403) {
      errorMessage = data.detail || data.message || 'You do not have permission to perform this action.';
    }
    // Handle Validation errors and others (400, etc.)
    else if (data) {
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (typeof data === 'object') {
        // Try to gather validation messages
        const errors = [];
        for (const [field, messages] of Object.entries(data)) {
          if (Array.isArray(messages)) {
            errors.push(...messages);
          } else if (typeof messages === 'string') {
            errors.push(messages);
          }
        }
        if (errors.length > 0) {
          errorMessage = errors.join(' ');
        }
      }
    }
  } else if (err.message) {
    errorMessage = err.message;
  }

  // Ensure message isn't insanely long
  const finalMessage = String(errorMessage).substring(0, 255);

  toast.error(finalMessage);
  return finalMessage;
};
