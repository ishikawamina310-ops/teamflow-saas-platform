'use client';

import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/features/i18n/hooks/useI18n';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, hasHydrated, setLocale, t } = useI18n();
  const currentLocaleLabel = locale === 'ja' ? t('common.japanese') : t('common.english');

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-between"
        disabled={!hasHydrated}
        onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
        aria-label={hasHydrated ? t('common.language') : t('common.loading')}
      >
        <span className="inline-flex items-center gap-2">
          <Languages className="h-4 w-4 opacity-80" />
          {t('common.language')}
        </span>
        <span className="text-xs text-muted-foreground">
          {hasHydrated ? currentLocaleLabel : t('common.loading')}
        </span>
      </Button>
    </div>
  );
}
