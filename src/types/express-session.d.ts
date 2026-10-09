import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: any;
    success?: string;
    error?: string;
  }
}
