import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const common = (await import(`./messages/${locale}/common.json`)).default;

  return {
    locale,
    messages: {
      Landing: (await import(`./messages/${locale}/Landing.json`)).default,
      NotFound: (await import(`./messages/${locale}/NotFound.json`)).default,

      // Dashboard - User
      Settings: (await import(`./messages/${locale}/Dashboard/User/Settings.json`)).default,
      CreditHistory: (await import(`./messages/${locale}/Dashboard/User/CreditHistory.json`)).default,

      // Dashboard - Admin
      Users: (await import(`./messages/${locale}/Dashboard/Admin/Users.json`)).default,
      DashboardBlogs: (await import(`./messages/${locale}/Dashboard/Admin/Blogs.json`)).default,
      R2Files: (await import(`./messages/${locale}/Dashboard/Admin/R2Files.json`)).default,
      Prices: (await import(`./messages/${locale}/Dashboard/Admin/Prices.json`)).default,

      // common
      ...common
    }
  };
});