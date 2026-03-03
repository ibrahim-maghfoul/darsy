// Shared locale configuration (no use server/client directive)
export const locales = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const COOKIE_NAME = 'NEXT_LOCALE';
