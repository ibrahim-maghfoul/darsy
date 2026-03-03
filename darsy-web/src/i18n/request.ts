import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'NEXT_LOCALE';
const defaultLocale = 'en';
const supportedLocales = ['en', 'fr', 'ar'];

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    const locale = raw && supportedLocales.includes(raw) ? raw : defaultLocale;

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});
