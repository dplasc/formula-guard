import { requireEmailVerification } from '@/lib/auth/verify-email-guard';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce email verification for admin
  await requireEmailVerification();

  return <>{children}</>;
}

