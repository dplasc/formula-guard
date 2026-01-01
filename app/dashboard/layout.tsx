import { requireEmailVerification } from '@/lib/auth/verify-email-guard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce email verification for dashboard
  await requireEmailVerification();

  return <>{children}</>;
}


