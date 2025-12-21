import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

/**
 * Show a success toast notification
 * @param message - Main message to display
 * @param description - Optional detailed description
 */
export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    icon: <CheckCircle2 className="h-5 w-5" />,
    duration: 4000,
  });
};

/**
 * Show an error toast notification
 * @param message - Main error message to display
 * @param description - Optional detailed error description
 */
export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    icon: <XCircle className="h-5 w-5" />,
    duration: 6000,
  });
};

/**
 * Show a warning toast notification
 * @param message - Main warning message to display
 * @param description - Optional detailed warning description
 */
export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    icon: <AlertCircle className="h-5 w-5" />,
    duration: 5000,
  });
};

/**
 * Show an info toast notification
 * @param message - Main info message to display
 * @param description - Optional detailed info description
 */
export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    icon: <Info className="h-5 w-5" />,
    duration: 4000,
  });
};

/**
 * Show a toast for a promise with loading, success, and error states
 * @param promise - Promise to track
 * @param messages - Messages for each state
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

/**
 * Show a custom toast with custom action
 * @param message - Main message to display
 * @param options - Toast options including action
 */
export const showToastWithAction = (
  message: string,
  options: {
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
  }
) => {
  toast(message, {
    description: options.description,
    duration: options.duration || 4000,
    action: options.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
};
