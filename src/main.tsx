import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./styles/logo-colors.css";
import "./styles/theme-trendy.css"; // Thème vert Pace (actif)

registerSW({ immediate: true });

async function initSentry() {
  if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return;

  const Sentry = await import("@sentry/react");
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
      }
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
}

createRoot(document.getElementById("root")!).render(<App />);

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(() => {
    void initSentry();
  });
} else {
  window.setTimeout(() => {
    void initSentry();
  }, 0);
}
