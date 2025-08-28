import { APICallError } from 'ai';

export const getErrorMessage = (error: unknown) => {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Check if it's an APICallError
    if (APICallError.isInstance(error)) {
      const apiError = error as any; // Cast to access properties

      // Try to extract error from response body
      try {
        const responseBody = apiError.responseBody;
        if (responseBody && typeof responseBody === 'string') {
          const parsed = JSON.parse(responseBody);
          if (parsed.error) {
            // If the response body contains an error object, use it
            return JSON.stringify(parsed.error);
          }
        }
      } catch {
        // Failed to parse response body
      }

      // Fallback to structured error info
      const errorInfo: any = {
        message: error.message,
        name: error.name,
        statusCode: apiError.statusCode,
        responseBody: apiError.responseBody,
      };

      return JSON.stringify(errorInfo);
    }

    // For other Error types, try to get detailed information
    const errorInfo: any = {
      message: error.message,
      name: error.name,
    };

    // Check for payment-kit specific properties
    if ('code' in error) {
      errorInfo.code = (error as any).code;
    }
    if ('httpStatus' in error) {
      errorInfo.httpStatus = (error as any).httpStatus;
    }
    if ('details' in error) {
      errorInfo.details = (error as any).details;
    }

    // Return a structured error message that processErrorMessage can parse
    return JSON.stringify(errorInfo);
  }

  return JSON.stringify(error);
};
