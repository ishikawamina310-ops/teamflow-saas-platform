import type { ReactNode } from 'react';

import { LanguageSwitcher } from '@/features/i18n/components/LanguageSwitcher';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="particle-bg subtle-grid-bg relative grid min-h-screen place-items-center overflow-hidden px-4">
      <LanguageSwitcher className="absolute right-4 top-4 w-36" />
      <div className="surface-panel w-full max-w-md p-8">{children}</div>
    </main>
  );
}
