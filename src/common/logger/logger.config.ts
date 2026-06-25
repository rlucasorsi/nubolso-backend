import * as Sentry from '@sentry/nestjs';
import type { Params } from 'nestjs-pino';
import type { IncomingMessage } from 'http';

interface AuthenticatedRequest extends IncomingMessage {
  user?: { sub: string; email: string };
}

type LogExtra = Record<string, unknown>;
type LogArgs = [obj: LogExtra, msg?: string] | [msg: string];

function forwardToSentry(inputArgs: LogArgs, level: number) {
  const isObjFirst = typeof inputArgs[0] === 'object' && inputArgs[0] !== null;
  const extra = isObjFirst ? (inputArgs[0] as LogExtra) : undefined;
  const message = isObjFirst ? inputArgs[1] : (inputArgs[0] as string);

  // pino-http auto-logs always include req+res — skip to avoid duplicating SentryGlobalFilter
  if (extra && 'req' in extra && 'res' in extra) return;

  if (level >= 50) {
    const rawErr = extra?.err;
    const err = rawErr instanceof Error ? rawErr : undefined;
    const extraWithoutErr = extra
      ? Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'err'))
      : undefined;

    if (err) {
      Sentry.captureException(err, { extra: extraWithoutErr });
    } else {
      Sentry.captureMessage(message ?? 'error', { level: 'error', extra });
    }
  } else {
    Sentry.addBreadcrumb({ level: 'warning', message, data: extra });
  }
}

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL || 'info',

    hooks: {
      logMethod(inputArgs, method, level) {
        if (level >= 40) forwardToSentry(inputArgs as LogArgs, level);
        method.apply(this, inputArgs);
      },
    },

    genReqId: (req) => {
      const existing = (
        req as IncomingMessage & { headers: Record<string, string> }
      ).headers['x-request-id'];
      return existing || crypto.randomUUID();
    },

    customProps: (req: AuthenticatedRequest) => ({
      userId: req.user?.sub,
      userEmail: req.user?.email,
    }),

    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    serializers: {
      req: (req: { method: string; url: string; remoteAddress: string }) => ({
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      }),
      res: (res: { statusCode: number }) => ({
        statusCode: res.statusCode,
      }),
    },

    redact: ['req.headers.authorization', 'req.headers.cookie'],

    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          }
        : undefined,
  },
};
