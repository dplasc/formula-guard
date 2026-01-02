"use client";

type PlanType = "monthly" | "yearly";

interface PlanSelectorProps {
  selectedPlan: PlanType;
  onPlanChange: (plan: PlanType) => void;
}

export default function PlanSelector({ selectedPlan, onPlanChange }: PlanSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        type="button"
        onClick={() => onPlanChange("monthly")}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          selectedPlan === "monthly"
            ? "bg-teal-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onPlanChange("yearly")}
        className={`px-4 py-2 rounded-md font-medium transition-colors relative ${
          selectedPlan === "yearly"
            ? "bg-teal-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Yearly
        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
          selectedPlan === "yearly"
            ? "bg-teal-700 text-white"
            : "bg-teal-100 text-teal-700"
        }`}>
          Save ~17%
        </span>
      </button>
    </div>
  );
}

