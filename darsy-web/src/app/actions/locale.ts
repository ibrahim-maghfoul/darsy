'use server';

import { cookies } from 'next/headers';
import { Locale, COOKIE_NAME } from '@/lib/localeConfig';

export async function setUserLocaleAction(locale: Locale) {
    const cookieStore = await cookies();
    (cookieStore as any).set(COOKIE_NAME, locale);
}
