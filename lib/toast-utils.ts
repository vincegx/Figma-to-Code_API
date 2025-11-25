import { toast } from '@/hooks/use-toast';

/**
 * Toast utility functions for consistent notifications across the app.
 * Wraps the shadcn/ui toast hook with convenience methods.
 */

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

/**
 * Show a success toast notification
 */
export function showSuccess(options: ToastOptions) {
  return toast({
    title: options.title,
    description: options.description,
    variant: 'default',
  });
}

/**
 * Show an error toast notification
 */
export function showError(options: ToastOptions) {
  return toast({
    title: options.title,
    description: options.description,
    variant: 'destructive',
  });
}

/**
 * Show an info toast notification
 */
export function showInfo(options: ToastOptions) {
  return toast({
    title: options.title,
    description: options.description,
    variant: 'default',
  });
}

/**
 * Pre-built error messages for Figma API errors
 */
export const FigmaErrors = {
  invalidToken: () =>
    showError({
      title: 'Invalid Figma access token',
      description: 'Your token is invalid or expired. Go to Settings to update it.',
    }),

  rateLimit: (retryAfter?: number) =>
    showError({
      title: 'Rate limit exceeded',
      description: retryAfter
        ? `Please wait ${retryAfter} seconds before retrying.`
        : 'Too many requests. Please wait a moment.',
    }),

  nodeNotFound: (nodeId: string) =>
    showError({
      title: 'Node not found',
      description: `The node "${nodeId}" was not found in the Figma file.`,
    }),

  networkError: (_onRetry?: () => void) =>
    showError({
      title: 'Network error',
      description: 'Check your internet connection and try again.',
    }),

  generic: (message: string) =>
    showError({
      title: 'Import failed',
      description: message,
    }),
};

/**
 * Pre-built success messages
 */
export const ImportSuccess = {
  nodeImported: (nodeName: string, _nodeId: string) =>
    showSuccess({
      title: 'Import successful!',
      description: `"${nodeName}" has been added to your library.`,
    }),
};
