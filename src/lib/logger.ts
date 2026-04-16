const isDev = import.meta.env.DEV;

export const logger = {
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, context);
    } else {
      import("@sentry/react")
        .then(({ captureException, withScope }) => {
          withScope((scope) => {
            if (context) scope.setExtras(context);
            scope.setTag("logger", message);
            const toCapture =
              error instanceof Error
                ? error
                : error !== undefined && error !== null
                  ? new Error(String(error))
                  : new Error(message);
            captureException(toCapture);
          });
        })
        .catch(() => {});
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (isDev) console.warn(`[WARN] ${message}`, context);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    if (isDev) console.info(`[INFO] ${message}`, context);
  },
};
