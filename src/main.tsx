import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./styles/logo-colors.css";

registerSW({ immediate: true });

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    if (event.exception?.values?.[0]?.value?.includes("ResizeObserver")) return null;
    return event;
  },
});

createRoot(document.getElementById("root")!).render(<App />);
