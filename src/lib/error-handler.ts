import { AxiosError } from "axios";

/**
 * Error types that can occur in the application
 */
export enum ErrorType {
  NETWORK = "network",
  TIMEOUT = "timeout",
  SERVER = "server",
  VALIDATION = "validation",
  AUTH = "auth",
  NOT_FOUND = "not_found",
  UNKNOWN = "unknown",
}

/**
 * Structured error information
 */
export interface AppError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: string[];
}

/**
 * Extract meaningful error message from various error types
 * Prioritizes backend messages over generic fallbacks
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage: string = "حدث خطأ غير متوقع"
): string {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    // Network error (no response from server)
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        return "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى";
      }
      return "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت";
    }

    // Extract backend error message
    const response = error.response;

    // Try different response formats
    if (response.data) {
      // Standard API response format: { message: "..." }
      if (typeof response.data.message === "string" && response.data.message) {
        return response.data.message;
      }

      // Alternative format: { error: "..." }
      if (typeof response.data.error === "string" && response.data.error) {
        return response.data.error;
      }

      // Validation errors array: { errors: ["...", "..."] }
      if (Array.isArray(response.data.errors) && response.data.errors.length > 0) {
        return response.data.errors.join("، ");
      }

      // ASP.NET validation errors: { errors: { field: ["error1", "error2"] } }
      if (typeof response.data.errors === "object" && response.data.errors) {
        const validationErrors = Object.values(response.data.errors)
          .flat()
          .filter(Boolean) as string[];

        if (validationErrors.length > 0) {
          return validationErrors.join("، ");
        }
      }

      // Direct string response
      if (typeof response.data === "string" && response.data) {
        return response.data;
      }
    }

    // HTTP status-based messages
    switch (response.status) {
      case 400:
        return "البيانات المدخلة غير صحيحة";
      case 401:
        return "يجب تسجيل الدخول أولاً";
      case 403:
        return "ليس لديك صلاحية للقيام بهذا الإجراء";
      case 404:
        return "المورد المطلوب غير موجود";
      case 409:
        return "يوجد تعارض مع البيانات الحالية";
      case 422:
        return "البيانات غير صالحة للمعالجة";
      case 429:
        return "عدد كبير من المحاولات. يرجى الانتظار قليلاً";
      case 500:
        return "خطأ في الخادم. يرجى المحاولة لاحقاً";
      case 502:
      case 503:
        return "الخادم غير متاح حالياً. يرجى المحاولة لاحقاً";
      case 504:
        return "انتهت مهلة الاتصال بالخادم";
      default:
        return fallbackMessage;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Fallback
  return fallbackMessage;
}

/**
 * Get detailed error information for logging/debugging
 */
export function getErrorDetails(error: unknown): AppError {
  if (error instanceof AxiosError) {
    // Network error
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        return {
          type: ErrorType.TIMEOUT,
          message: extractErrorMessage(error),
        };
      }
      return {
        type: ErrorType.NETWORK,
        message: extractErrorMessage(error),
      };
    }

    const response = error.response;
    const statusCode = response.status;

    // Determine error type based on status code
    let type: ErrorType;
    if (statusCode === 401) {
      type = ErrorType.AUTH;
    } else if (statusCode === 404) {
      type = ErrorType.NOT_FOUND;
    } else if (statusCode === 422 || statusCode === 400) {
      type = ErrorType.VALIDATION;
    } else if (statusCode >= 500) {
      type = ErrorType.SERVER;
    } else {
      type = ErrorType.UNKNOWN;
    }

    // Extract validation details if available
    let details: string[] | undefined;
    if (response.data?.errors) {
      if (Array.isArray(response.data.errors)) {
        details = response.data.errors;
      } else if (typeof response.data.errors === "object") {
        details = Object.values(response.data.errors).flat() as string[];
      }
    }

    return {
      type,
      message: extractErrorMessage(error),
      statusCode,
      details,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: extractErrorMessage(error),
  };
}

/**
 * Check if error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response || error.code === "ERR_NETWORK";
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return status === 400 || status === 422;
  }
  return false;
}
