'use client';

import { useEffect, useMemo } from 'react';

import { translate, type TranslationKey } from '@/lib/i18n';
import { useLocaleStore } from '@/stores/locale.store';

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const hasHydrated = useLocaleStore((s) => s._hasHydrated);
  const setLocale = useLocaleStore((s) => s.setLocale);

  useEffect(() => {
    if (!hasHydrated) return;
    document.documentElement.lang = locale;
  }, [hasHydrated, locale]);

  const t = useMemo(
    () =>
      (key: TranslationKey, vars?: Record<string, string | number>) =>
        translate(locale, key, vars),
    [locale],
  );

  return { locale, hasHydrated, setLocale, t };
}
