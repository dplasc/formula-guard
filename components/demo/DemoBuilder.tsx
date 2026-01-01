'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { demoIngredients, type DemoIngredient } from '@/lib/demoIngredients';

type ProductType = 'leave-on' | 'rinse-off';

interface FormulaIngredient {
  id: string;
  ingredientId: string;
  name: string;
  inci: string;
  category: DemoIngredient['category'];
  percentage: number;
  limit: number;
}

export default function DemoBuilder() {
  const [productType, setProductType] = useState<ProductType>('leave-on');
  const [ingredients, setIngredients] = useState<FormulaIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');

  // Get available ingredients (not already added)
  const availableIngredients = useMemo(() => {
    const addedIds = new Set(ingredients.map((ing) => ing.ingredientId));
    return demoIngredients.filter((ing) => !addedIds.has(ing.id));
  }, [ingredients]);

  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  }, [ingredients]);

  // Get status badge for an ingredient
  const getIngredientStatus = (ing: FormulaIngredient): 'ok' | 'caution' | 'exceeded' => {
    const threshold = ing.limit * 0.9; // 90% of limit
    if (ing.percentage > ing.limit) return 'exceeded';
    if (ing.percentage > threshold) return 'caution';
    return 'ok';
  };

  // Add ingredient to formula
  const handleAddIngredient = () => {
    if (!selectedIngredientId) return;

    const ingredient = demoIngredients.find((ing) => ing.id === selectedIngredientId);
    if (!ingredient) return;

    const limit = productType === 'leave-on' 
      ? ingredient.demoLimitLeaveOn 
      : ingredient.demoLimitRinseOff;

    const newIngredient: FormulaIngredient = {
      id: `${ingredient.id}-${Date.now()}`,
      ingredientId: ingredient.id,
      name: ingredient.name,
      inci: ingredient.inci,
      category: ingredient.category,
      percentage: 0,
      limit,
    };

    setIngredients([...ingredients, newIngredient]);
    setSelectedIngredientId('');
  };

  // Remove ingredient
  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  // Update percentage
  const handlePercentageChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, percentage: Math.max(0, Math.min(100, numValue)) } : ing
      )
    );
  };

  // Check if any fragrance ingredients are present
  const hasFragrance = ingredients.some((ing) => ing.category === 'Fragrance');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            FormulaGuard Demo
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Try the interactive formula builder with safety guardrails and usage limits.
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <p className="text-sm text-gray-700">
              <strong className="font-semibold text-gray-900">Note:</strong> Demo is illustrative and does not replace regulatory assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Type Toggle */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setProductType('leave-on');
                // Update limits for existing ingredients
                setIngredients(
                  ingredients.map((ing) => {
                    const baseIng = demoIngredients.find((i) => i.id === ing.ingredientId);
                    return {
                      ...ing,
                      limit: baseIng?.demoLimitLeaveOn ?? ing.limit,
                    };
                  })
                );
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                productType === 'leave-on'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Leave-on
            </button>
            <button
              onClick={() => {
                setProductType('rinse-off');
                // Update limits for existing ingredients
                setIngredients(
                  ingredients.map((ing) => {
                    const baseIng = demoIngredients.find((i) => i.id === ing.ingredientId);
                    return {
                      ...ing,
                      limit: baseIng?.demoLimitRinseOff ?? ing.limit,
                    };
                  })
                );
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                productType === 'rinse-off'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rinse-off
            </button>
          </div>
        </div>

        {/* Add Ingredient */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Add Ingredient
          </label>
          <div className="flex gap-3">
            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select an ingredient...</option>
              {availableIngredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.category})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddIngredient}
              disabled={!selectedIngredientId}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>
        </div>

        {/* Total Percentage Indicator */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Total Percentage</span>
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold ${
                  Math.abs(totalPercentage - 100) < 0.01
                    ? 'text-teal-600'
                    : totalPercentage > 100
                    ? 'text-red-600'
                    : 'text-amber-600'
                }`}
              >
                {totalPercentage.toFixed(1)}%
              </span>
              {Math.abs(totalPercentage - 100) < 0.01 ? (
                <CheckCircle className="w-6 h-6 text-teal-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
            </div>
          </div>
          {Math.abs(totalPercentage - 100) >= 0.01 && (
            <p className="mt-2 text-sm text-amber-600">
              Formula must total exactly 100%. Current difference: {Math.abs(100 - totalPercentage).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Ingredients List */}
        {ingredients.length > 0 ? (
          <div className="space-y-4 mb-6">
            {ingredients.map((ing) => {
              const status = getIngredientStatus(ing);
              return (
                <div
                  key={ing.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{ing.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{ing.inci}</p>
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {ing.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveIngredient(ing.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove ingredient"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-3 flex items-center gap-2">
                        {status === 'ok' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            OK ({ing.percentage.toFixed(1)}% / {ing.limit}% limit)
                          </span>
                        )}
                        {status === 'caution' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 rounded-full">
                            <AlertTriangle className="w-4 h-4" />
                            Caution ({ing.percentage.toFixed(1)}% / {ing.limit}% limit)
                          </span>
                        )}
                        {status === 'exceeded' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                            <AlertTriangle className="w-4 h-4" />
                            Limit exceeded ({ing.percentage.toFixed(1)}% / {ing.limit}% limit)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={ing.percentage}
                        onChange={(e) => handlePercentageChange(ing.id, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center mb-6">
            <p className="text-gray-500">No ingredients added yet. Use the form above to add ingredients to your formula.</p>
          </div>
        )}

        {/* IFRA Note Panel */}
        {hasFragrance && (
          <div className="bg-teal-50 border-l-4 border-teal-600 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">IFRA Note</h3>
                <p className="text-gray-700 leading-relaxed">
                  Fragrance ingredients detected. IFRA (International Fragrance Association) standards apply. 
                  The limits shown are illustrative examples. Actual IFRA compliance requires consultation with 
                  fragrance suppliers and may depend on specific IFRA categories, allergen declarations, and 
                  regional regulations. Always verify with your fragrance supplier and regulatory expert.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Start free
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-teal-600 font-medium rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            >
              Read the blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


