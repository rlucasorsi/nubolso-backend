import * as Sentry from '@sentry/nestjs';
import { pinoIntegration } from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? 'development',
  release: process.env.SENTRY_RELEASE,

  // Tracing — auto-instruments middleware, guards, pipes, interceptors, handlers
  tracesSampler: ({ name }) => {
    // Drop health-check and static asset transactions
    if (/\/(health|ping|readiness|liveness|public)/.test(name)) return 0;
    return 1.0; // 100% in dev/staging; lower to 0.1–0.2 in high-traffic production
  },

  // Add Prisma query spans + bridge pino logs to Sentry Logs
  integrations: [Sentry.prismaIntegration(), pinoIntegration()],

  // Restrict sentry-trace header propagation to own services only
  // (prevents leaking trace context to Stripe, Resend, etc.)
  tracePropagationTargets: ['localhost', /^https:\/\/nubolso\.com/],

  // Structured Sentry Logs (SDK ≥ 9.41.0)
  enableLogs: true,

  // PII — userInfo false: don't auto-attach IP/user data to events
  dataCollection: {
    userInfo: false,
  },
});
