import { requireEmailVerification } from '@/lib/auth/verify-email-guard';
import { getFormulaById } from '@/app/actions/getFormulaById';
import { redirect } from 'next/navigation';
import BuilderClient from '@/components/BuilderClient';

export default async function FormulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Enforce email verification
  await requireEmailVerification();

  const { id } = await params;

  // Fetch formula server-side
  const { data: formula, error } = await getFormulaById(id);

  if (error || !formula) {
    // Log technical error for debugging
    console.error(error);
    // Redirect to dashboard if formula not found or access denied
    redirect('/dashboard?error=load_formula');
  }

  // Transform formula data to match builder's expected format
  const d = (formula as any).data ?? {};
  const initialFormulaData = {
    id: formula.id,
    name: formula.name,
    ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
    batchSize: d.batchSize ?? 100,
    unitSize: d.unitSize,
    procedure: d.procedure || '',
    notes: d.notes || '',
    processSteps: d.processSteps || [],
  };

  return <BuilderClient initialFormulaId={formula.id} initialFormulaData={initialFormulaData} />;
}


