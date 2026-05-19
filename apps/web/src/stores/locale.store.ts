import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n';

interface LocaleState {
  locale: Locale;
  _hasHydrated: boolean;
  setLocale: (locale: Locale) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      _hasHydrated: false,
      setLocale: (locale) => set({ locale }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'teamflow.locale',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ locale: s.locale }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
