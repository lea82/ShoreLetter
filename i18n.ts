import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const locale = 'zh' // Mandarin default

  return {
    locale,
    messages: (await import(`./src/locales/${locale}/common.json`)).default
  }
})
