'use client';

import { LoginForm } from '@/features/auth/components/LoginForm';
import { useI18n } from '@/features/i18n/hooks/useI18n';

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">TeamFlow</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t('auth.welcomeBack')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.signInSubtitle')}</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">{t('auth.needAccess')}</p>
    </div>
  );
}
