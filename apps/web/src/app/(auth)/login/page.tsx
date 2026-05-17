import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your TeamFlow account.</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Need access? Contact your workspace administrator.
      </p>
    </div>
  );
}
