'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@teamflow/shared';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/features/i18n/hooks/useI18n';

import { useLogin } from '../hooks/useAuth';

export function LoginForm() {
  const { t } = useI18n();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <form className="space-y-4" onSubmit={handleSubmit((data) => login.mutate(data))}>
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? <Loader2 className="size-4 animate-spin" /> : t('auth.signIn')}
      </Button>
    </form>
  );
}
