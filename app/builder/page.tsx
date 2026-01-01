import { requireEmailVerification } from '@/lib/auth/verify-email-guard';
import BuilderClient from '@/components/BuilderClient';

export default async function BuilderPage() {
  // Enforce email verification for builder
  await requireEmailVerification();

  return <BuilderClient />;
}


