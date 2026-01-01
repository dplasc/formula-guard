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
    // Redirect to dashboard if formula not found or access denied
    redirect('/dashboard');
  }

  // Transform formula data to match builder's expected format
  const initialFormulaData = {
    id: formula.id,
    name: formula.name,
    ingredients: formula.formula_data.ingredients || [],
    batchSize: formula.formula_data.batchSize || formula.batch_size || 100,
    unitSize: formula.formula_data.unitSize,
    procedure: formula.formula_data.procedure || '',
    notes: formula.formula_data.notes || '',
    processSteps: formula.formula_data.processSteps || [],
  };

  return <BuilderClient initialFormulaId={formula.id} initialFormulaData={initialFormulaData} />;
}


