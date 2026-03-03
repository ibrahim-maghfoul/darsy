'use server';

import { cookies } from 'next/headers';
import { Locale, defaultLocale, COOKIE_NAME } from './localeConfig';

export type { Locale };
export { locales } from './localeConfig';

export async function getUserLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const locale = cookieStore.get(COOKIE_NAME)?.value;
    return (locale as Locale) || defaultLocale;
}

export async function setUserLocale(locale: Locale) {
    const cookieStore = await cookies();
    (cookieStore as any).set(COOKIE_NAME, locale);
}
