import { posthog } from './lib/posthog'
import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App.jsx';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      try {
        const sessionUrl = posthog.get_session_replay_url({ withTimestamp: true })
        if (sessionUrl) {
          event.tags = { ...event.tags, posthog_session_replay_url: sessionUrl }
        }
      } catch (_) {}
      return event
    },
  });
}

const AppWithProfiler = Sentry.withProfiler(App);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>The error has been reported. Try refreshing the page.</p>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
    >
      <AppWithProfiler />
      <SpeedInsights />
      <Analytics />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
