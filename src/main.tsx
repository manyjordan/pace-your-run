import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./styles/logo-colors.css";
import "./styles/theme-trendy.css"; // Thème vert Pace (actif)

registerSW({ immediate: true });

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5,
  beforeSend(event) {
    // Remove IP address
    if (event.user) {
      delete event.user.ip_address;
    }
    // Remove full URL query params that might contain sensitive data
    if (event.request?.url) {
      try {
        const url = new URL(event.request.url);
        event.request.url = `${url.origin}${url.pathname}`;
      } catch {
        // ignore malformed URLs
      }
    }
    return event;
  },
});

createRoot(document.getElementById("root")!).render(<App />);
