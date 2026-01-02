"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ingredients as allIngredients, type Ingredient as IngredientDataBase } from "@/data/mockIngredients";
import { useAuth } from "@/hooks/useAuth";

// Extend IngredientData to include custom flag and safety fields
type IngredientData = IngredientDataBase & {
  isCustom?: boolean;
  // Safety normalization fields (V1.9)
  isVerified?: boolean;
  productType?: 'leave-on' | 'rinse-off' | 'both';
};
import { Download, Trash2, Search, FolderOpen, X, Sparkles, Briefcase, User, Plus, Check, Lock, Cloud, FilePlus, Pin, PinOff, AlertTriangle, Info, AlertCircle, ChevronDown, ChevronUp, HelpCircle, Share2, Printer } from "lucide-react";
import { generateCosmeticFormulationReport } from "@/utils/pdfGenerator";
import { saveFormula } from "@/app/actions/formulas";
import { getFormulaById } from "@/app/actions/getFormulaById";
import { evaluateSafetyWarnings, getUnverifiedIngredients, type SafetyWarning } from "@/lib/safetyRules";
import { getIngredientKbMap, type IngredientKbRow } from "@/app/builder/actions-ingredient-kb";
import { resolveIngredientInci } from "@/app/builder/actions-ingredient-synonyms";
import { getEuComplianceMap, type EuAnnexEntry, getIfraComplianceMap, type IfraEntry } from "@/app/builder/actions-eu-compliance";
import { checkEUCompliance, type BlockItem } from "@/lib/euCompliance";
import { processTemplates, type ProcessTemplate } from "@/lib/templates/processTemplates";

interface Ingredient {
  id: string;
  name: string;
  percentage: number;
  maxUsage?: number;
  description?: string;
  ingredientId?: string; // ID from the full ingredient data for lookup
  phase: string; // Formulation phase (A, B, C, D, E)
  pricePerKg?: number; // Price per kg in EUR, can be manually overridden
  isPremium?: boolean; // Premium ingredient flag
  isCustom?: boolean; // Custom ingredient flag
  isFragranceComponent?: boolean; // Fragrance component flag
}

type ProcessPhase = 'A' | 'B' | 'C' | 'coolDown' | 'general';

interface ProcessStep {
  id: string;                // uuid or nanoid
  order: number;             // 1..n
  title: string;             // e.g. "Heat Phase A"
  description?: string;      // free text
  phase?: ProcessPhase;      // optional
  tempC?: number | null;     // optional
  timeMin?: number | null;   // optional
  notes?: string;            // optional
}

interface SavedFormula {
  id: string;
  name: string;
  ingredients: Ingredient[];
  batchSize: number;
  unitSize?: number; // Unit size for cost-per-unit calculation
  procedure: string;
  notes: string;
  processSteps?: ProcessStep[]; // optional for backward compatibility
  savedAt: number; // timestamp
}

type CategoryFilter = "All" | "Lipid" | "Emulsifier/Thickener" | "Active/Extract";

interface FormulaCalculatorProps {
  initialFormulaId?: string | null;
  initialFormulaData?: {
    id: string;
    name: string;
    ingredients: Ingredient[];
    batchSize: number;
    unitSize?: number;
    procedure: string;
    notes: string;
    processSteps?: ProcessStep[];
    workflow_status?: 'draft' | 'testing' | 'final' | 'archived';
    is_pinned?: boolean;
    organizationNotes?: string | null;
  } | null;
  onDirtyChange?: (isDirty: boolean) => void;
}

export default function FormulaCalculator({ initialFormulaId, initialFormulaData, onDirtyChange }: FormulaCalculatorProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [focusedIngredientId, setFocusedIngredientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(100);
  const [unitSize, setUnitSize] = useState<number>(50);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [procedure, setProcedure] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formulaName, setFormulaName] = useState<string>("My New Formula");
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [savedFormulas, setSavedFormulas] = useState<SavedFormula[]>([]);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [customIngredients, setCustomIngredients] = useState<IngredientData[]>([]);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showManageCustomModal, setShowManageCustomModal] = useState<boolean>(false);
  const [showExportSummaryModal, setShowExportSummaryModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showProcessStepModal, setShowProcessStepModal] = useState<boolean>(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>("");
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [newProcessStep, setNewProcessStep] = useState<Partial<ProcessStep>>({
    title: "",
    phase: undefined,
    tempC: null,
    timeMin: null,
    description: "",
    notes: "",
  });
  const [newCustomIngredient, setNewCustomIngredient] = useState({
    name: "",
    inci: "",
    averagePricePerKg: 0,
    category: "Lipid",
    subcategory: "",
    minUsage: 0.1,
    maxUsage: 100,
    maxUsageLeaveOn: undefined as number | undefined,
    maxUsageRinseOff: undefined as number | undefined,
    description: "",
    absorption: "",
    comedogenicRating: undefined as number | undefined,
    heatSensitive: false,
    productType: 'both' as 'leave-on' | 'rinse-off' | 'both',
  });
  const [showAdvancedLimits, setShowAdvancedLimits] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [currentFormulaId, setCurrentFormulaId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isFormulaDeleted, setIsFormulaDeleted] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'testing' | 'final' | 'archived'>('draft');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [organizationNotes, setOrganizationNotes] = useState<string>('');
  const [productType, setProductType] = useState<'leaveOn' | 'rinseOff'>('leaveOn');
  const [ingredientKbMap, setIngredientKbMap] = useState<Record<string, IngredientKbRow>>({});
  
  // BUSINESS-3: Derive isPaidUser from Supabase user metadata (canonical: plan === "pro")
  const isPaidUser = useMemo(() => {
    if (!user) return false; // Default to free if user not loaded
    // Canonical paid check: app_metadata.plan === "pro"
    return user.app_metadata?.plan === "pro";
  }, [user]);
  
  // STRIPE-3: Show upgrade success message
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user is paid and has upgraded=1 query param
    if (isPaidUser && searchParams.get('upgraded') === '1') {
      setShowUpgradeSuccess(true);
      
      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        setShowUpgradeSuccess(false);
        
        // Remove query param from URL
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('upgraded');
        const newSearch = newSearchParams.toString();
        const newUrl = newSearch ? `?${newSearch}` : window.location.pathname;
        router.replace(newUrl, { scroll: false });
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [isPaidUser, searchParams, router]);
  
  const [synonymMap, setSynonymMap] = useState<Record<string, string>>({}); // original name -> canonical_inci
  const [euComplianceMap, setEuComplianceMap] = useState<Record<string, EuAnnexEntry[]>>({});
  const [euComplianceBlocks, setEuComplianceBlocks] = useState<BlockItem[]>([]);
  const [ifraComplianceMap, setIfraComplianceMap] = useState<Record<string, IfraEntry[]>>({});
  const [ifraWarnings, setIfraWarnings] = useState<Array<{ ingredientName: string; inci: string; entries: IfraEntry[] }>>([]);
  
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const requireAuth = (action: () => void) => {
    if (!user) {
      const proceed = confirm("This feature requires an account. Would you like to sign in or create an account?");
      if (proceed) {
        router.push("/auth");
      }
      return;
    }
    action();
  };

  // Helper function to mark formula as dirty
  const markDirty = () => {
    setIsDirty(true);
    setSaveError(null);
  };

  // V1.9: Safety normalization function for custom ingredients
  const normalizeCustomIngredient = (ingredient: IngredientData): IngredientData => {
    // 1. Category enforcement: ensure category is present
    const category: IngredientData['category'] = (ingredient.category?.trim() || "Other") as IngredientData['category'];
    
    // 2. Verification logic: isVerified = true ONLY if category is present AND maxUsage is defined
    const isVerified = !!(category && (ingredient.maxUsage !== undefined && ingredient.maxUsage !== null));
    
    // 3. Product type default: treat as 'both' if missing
    const productType = ingredient.productType || 'both';
    
    return {
      ...ingredient,
      category,
      isVerified,
      productType,
    };
  };

  // Notify parent when dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Navigation guard: warn when leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Intercept internal navigation links when isDirty is true
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isDirty) return;

      const target = e.target as HTMLElement | null;
      const a = target?.closest?.('a') as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute('href') || '';
      if (!href) return;

      // ignore hash/external/mailto/tel
      if (href.startsWith('#')) return;
      if (href.startsWith('http://') || href.startsWith('https://')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      // only internal routes
      if (!href.startsWith('/')) return;

      const ok = window.confirm('You have unsaved changes. Leave without saving?');
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isDirty]);

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: "",
      percentage: 0,
      phase: "A", // Default phase
    };
    setIngredients([...ingredients, newIngredient]);
    markDirty();
  };

  // GROWTH-2: Load example formula for new users
  const loadExampleFormula = () => {
    // GROWTH-3: Log example formula loaded event
    console.info("[FG_EVENT]", {
      event: "example_formula_loaded",
      timestamp: new Date().toISOString()
    });

    // Find ingredients from the database
    const jojobaOil = allIngredients.find(ing => ing.id === "jojoba-oil");
    const squalane = allIngredients.find(ing => ing.id === "squalane-olive");
    const olivem = allIngredients.find(ing => ing.id === "olivem-1000");
    const panthenol = allIngredients.find(ing => ing.id === "d-panthenol");
    const hyaluronicAcid = allIngredients.find(ing => ing.id === "hyaluronic-acid-lmw");
    const sweetAlmondOil = allIngredients.find(ing => ing.id === "sweet-almond-oil");

    // Create example formula with safe percentages (sums to 100%)
    const exampleIngredients: Ingredient[] = [];
    let idCounter = 1;

    if (sweetAlmondOil) {
      exampleIngredients.push({
        id: `example-${idCounter++}`,
        name: sweetAlmondOil.name,
        percentage: 35,
        phase: "A",
        ingredientId: sweetAlmondOil.id,
        maxUsage: sweetAlmondOil.maxUsage,
        description: sweetAlmondOil.description,
        pricePerKg: sweetAlmondOil.averagePricePerKg,
        isPremium: sweetAlmondOil.isPremium,
        isCustom: sweetAlmondOil.isCustom,
      });
    }

    if (jojobaOil) {
      exampleIngredients.push({
        id: `example-${idCounter++}`,
        name: jojobaOil.name,
        percentage: 25,
        phase: "A",
        ingredientId: jojobaOil.id,
        maxUsage: jojobaOil.maxUsage,
        description: jojobaOil.description,
        pricePerKg: jojobaOil.averagePricePerKg,
        isPremium: jojobaOil.isPremium,
        isCustom: jojobaOil.isCustom,
      });
    }

    if (squalane) {
      exampleIngredients.push({
        id: `example-${idCounter++}`,
        name: squalane.name,
        percentage: 20,
        phase: "A",
        ingredientId: squalane.id,
        maxUsage: squalane.maxUsage,
        description: squalane.description,
        pricePerKg: squalane.averagePricePerKg,
        isPremium: squalane.isPremium,
        isCustom: squalane.isCustom,
      });
    }

    if (olivem) {
      exampleIngredients.push({
        id: `example-${idCounter++}`,
        name: olivem.name,
        percentage: 15,
        phase: "A",
        ingredientId: olivem.id,
        maxUsage: olivem.maxUsage,
        description: olivem.description,
        pricePerKg: olivem.averagePricePerKg,
        isPremium: olivem.isPremium,
        isCustom: olivem.isCustom,
      });
    }

    if (panthenol) {
      exampleIngredients.push({
        id: `example-${idCounter++}`,
        name: panthenol.name,
        percentage: 4.8,
        phase: "A",
        ingredientId: panthenol.id,
        maxUsage: panthenol.maxUsage,
        description: panthenol.description,
        pricePerKg: panthenol.averagePricePerKg,
        isPremium: panthenol.isPremium,
        isCustom: panthenol.isCustom,
      });
    }

    if (hyaluronicAcid) {
      exampleIngredients.push({
        id: `example-${idCounter++}`,
        name: hyaluronicAcid.name,
        percentage: 0.2,
        phase: "A",
        ingredientId: hyaluronicAcid.id,
        maxUsage: hyaluronicAcid.maxUsage,
        description: hyaluronicAcid.description,
        pricePerKg: hyaluronicAcid.averagePricePerKg,
        isPremium: hyaluronicAcid.isPremium,
        isCustom: hyaluronicAcid.isCustom,
      });
    }

    // Set the example ingredients (sums to 100%)
    setIngredients(exampleIngredients);
    markDirty();
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
    markDirty();
  };

  const updateIngredient = (id: string, field: "name" | "percentage" | "phase" | "pricePerKg" | "isFragranceComponent", value: string | number | boolean) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.id === id) {
          const updated = { ...ing, [field]: value };
          // If name changed, clear safety data unless it matches an ingredient
          if (field === "name") {
            // Combine all ingredients (standard + custom) for lookup
            const allAvailableIngredients = [...allIngredients, ...customIngredients];
            const matchedIngredient = allAvailableIngredients.find(
              (mock) => mock.name.toLowerCase() === String(value).toLowerCase()
            );
            if (matchedIngredient) {
              updated.maxUsage = matchedIngredient.maxUsage;
              updated.description = matchedIngredient.description;
              updated.ingredientId = matchedIngredient.id; // Store ingredient ID for PDF generation
              updated.isPremium = matchedIngredient.isPremium; // Store premium flag
              updated.isCustom = matchedIngredient.isCustom; // Store custom flag
              // Auto-fill price if not already manually set
              if (updated.pricePerKg === undefined) {
                updated.pricePerKg = matchedIngredient.averagePricePerKg;
              }
            } else {
              // Clear safety data if not matching
              delete updated.maxUsage;
              delete updated.description;
              delete updated.ingredientId;
              delete updated.isPremium;
              delete updated.isCustom;
            }
          }
          return updated;
        }
        return ing;
      })
    );
    markDirty();
  };

  const selectIngredient = (id: string, ingredientData: IngredientData) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id
          ? {
              ...ing,
              name: ingredientData.name,
              maxUsage: ingredientData.maxUsage,
              description: ingredientData.description,
              ingredientId: ingredientData.id, // Store the full ingredient ID for PDF generation
              isPremium: ingredientData.isPremium, // Store premium flag
              isCustom: ingredientData.isCustom, // Store custom flag
              // Auto-fill price if not already manually set
              pricePerKg: ing.pricePerKg !== undefined ? ing.pricePerKg : ingredientData.averagePricePerKg,
            }
          : ing
      )
    );
    setFocusedIngredientId(null);
    setSearchQuery("");
    setShowSuggestions(false);
    markDirty();
  };

  // Helper function to enrich ingredient with KB data
  const enrichIngredientWithKb = (ingredient: IngredientData): IngredientData => {
    if (!ingredient.inci) return ingredient;
    
    // Look up KB data by normalized INCI
    const normalizedInci = ingredient.inci.trim().toLowerCase();
    const kbData = ingredientKbMap[normalizedInci];
    
    if (!kbData) return ingredient;
    
    // Merge KB max usage fields into ingredient
    return {
      ...ingredient,
      maxUsageLeaveOn: kbData.default_max_leave_on ?? ingredient.maxUsageLeaveOn ?? null,
      maxUsageRinseOff: kbData.default_max_rinse_off ?? ingredient.maxUsageRinseOff ?? null,
    };
  };

  // Helper function to filter suggestions based on query and category
  // Case-insensitive filtering - match 'cin' with 'Cinnamon'
  // Match ANY part of ingredient name (case-insensitive)
  const getFilteredSuggestions = (query: string): IngredientData[] => {
    // Combine all ingredients (standard + custom)
    const allAvailableIngredients = [...allIngredients, ...customIngredients].map(enrichIngredientWithKb);
    let filtered = allAvailableIngredients;

    // Apply category filter
    if (selectedCategory !== "All") {
      // Map UI tab values to actual ingredient.category strings
      const categoryToIngredientCategory: Record<string, string> = {
        "lipid": "Oils & Butters",
        "emulsifier": "Emulsifier/Thickener",
        "emulsifier/thickener": "Emulsifier/Thickener",
        "active": "Active/Extract",
        "active/extract": "Active/Extract",
      };
      const categoryKey = (selectedCategory ?? "").toLowerCase();
      const categoryToFilter = categoryToIngredientCategory[categoryKey];
      if (categoryToFilter) {
        filtered = filtered.filter((ing) => ing.category === categoryToFilter);
      }
    }

    // Apply search query filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      filtered = filtered.filter((ing) => {
        const nameMatch = ing.name.toLowerCase().includes(lowerQuery);
        // Future: add alias matching here if needed
        return nameMatch;
      });
    }

    return filtered;
  };

  const getSafetyError = (ingredient: Ingredient): string | null => {
    if (ingredient.maxUsage !== undefined && ingredient.percentage > ingredient.maxUsage) {
      return `Safety Warning: Max allowed is ${ingredient.maxUsage}%`;
    }
    return null;
  };

  // Load saved formulas from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("saved_formulas");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as any[];
        // Ensure backward compatibility: add notes and unitSize fields if missing
        const formulasWithNotes = parsed.map((f) => ({
          ...f,
          notes: f.notes || "",
          unitSize: f.unitSize || 50, // Default to 50 for backward compatibility
        })) as SavedFormula[];
        setSavedFormulas(formulasWithNotes);
      } catch (error) {
        console.error("Error loading saved formulas:", error);
      }
    }
  }, []);

  // Load custom ingredients from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("custom_ingredients");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as IngredientData[];
        // V1.9: Normalize all custom ingredients on load for safety compliance
        const normalized = parsed.map(ing => normalizeCustomIngredient(ing));
        setCustomIngredients(normalized);
        // Save normalized version back to localStorage if any changes were made
        const needsUpdate = normalized.some((ing, idx) => {
          const original = parsed[idx];
          return ing.category !== original.category || 
                 ing.isVerified !== original.isVerified || 
                 ing.productType !== original.productType;
        });
        if (needsUpdate) {
          localStorage.setItem("custom_ingredients", JSON.stringify(normalized));
        }
      } catch (error) {
        console.error("Error loading custom ingredients:", error);
      }
    }
  }, []);

  // Load initial formula data from props (when loaded from URL)
  useEffect(() => {
    if (initialFormulaData && initialFormulaId) {
      setFormulaName(initialFormulaData.name);
      setIngredients(initialFormulaData.ingredients);
      setBatchSize(initialFormulaData.batchSize);
      setUnitSize(initialFormulaData.unitSize || 50);
      setProcedure(initialFormulaData.procedure);
      setNotes(initialFormulaData.notes);
      setProcessSteps(initialFormulaData.processSteps || []);
      setCurrentFormulaId(initialFormulaId);
      // Load organization fields
      setWorkflowStatus(initialFormulaData.workflow_status || 'draft');
      setIsPinned(initialFormulaData.is_pinned || false);
      setOrganizationNotes(initialFormulaData.organizationNotes || '');
      // Reset sync states when loading
      setIsDirty(false);
      setIsFormulaDeleted(false);
      setSaveError(null);
    }
  }, [initialFormulaData, initialFormulaId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (focusedIngredientId) {
        const dropdownRef = dropdownRefs.current[focusedIngredientId];
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
          setFocusedIngredientId(null);
          setSearchQuery("");
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [focusedIngredientId]);

  // Debounced effect to fetch ingredient KB data when formula ingredients change
  useEffect(() => {
    // Build candidate names list (both INCI and ingredient names for synonym resolution)
    const candidateNames: string[] = [];
    const allAvailableIngredients = [...allIngredients, ...customIngredients];

    for (const ing of ingredients) {
      // Find full ingredient data to get INCI
      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());

      if (fullIngredient) {
        // Standard ingredient: use INCI from mockIngredients
        if (fullIngredient.inci) {
          candidateNames.push(fullIngredient.inci);
        }
        // Also include ingredient name as it might be a trade name/synonym
        if (ing.name.trim()) {
          candidateNames.push(ing.name.trim());
        }
      } else if (ing.isCustom) {
        // Custom ingredient: try to find in customIngredients by name
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        if (customIng?.inci) {
          candidateNames.push(customIng.inci);
        }
        // Also include ingredient name for synonym resolution
        if (ing.name.trim()) {
          candidateNames.push(ing.name.trim());
        }
      } else {
        // Unknown ingredient: use name directly (might be a trade name)
        if (ing.name.trim()) {
          candidateNames.push(ing.name.trim());
        }
      }
    }

    // Remove duplicates and normalize
    const uniqueNames = Array.from(new Set(candidateNames.filter(name => name && name.trim().length > 0)));

    // Debounce: wait 300ms before fetching
    const timeoutId = setTimeout(async () => {
      if (uniqueNames.length === 0) {
        setIngredientKbMap({});
        setSynonymMap({});
        return;
      }

      // Step 1: Resolve synonyms for all candidate names
      let resolvedSynonyms: Record<string, string> = {};
      const synonymResult = await resolveIngredientInci(uniqueNames);
      if (synonymResult.error) {
        console.error('[FormulaCalculator] Error resolving synonyms:', synonymResult.error);
      } else {
        resolvedSynonyms = synonymResult.data;
      }

      // Step 2: Build final INCI list using resolved canonical INCI where available
      const finalInciList: string[] = [];
      const synonymMapping: Record<string, string> = {};

      for (const name of uniqueNames) {
        const trimmedName = name.trim();
        // If we have a synonym resolution, use canonical INCI
        if (resolvedSynonyms[trimmedName]) {
          const canonicalInci = resolvedSynonyms[trimmedName];
          finalInciList.push(canonicalInci);
          // Normalize keys to lowercase for consistent lookup (matching buildSafetyWarnings normalization)
          const normalizedKey = trimmedName.toLowerCase();
          synonymMapping[normalizedKey] = canonicalInci;
        } else {
          // Use original name/INCI
          finalInciList.push(trimmedName);
        }
      }

      // Remove duplicates from final INCI list
      const uniqueInciList = Array.from(new Set(finalInciList));

      // Step 3: Query ingredient_kb with final INCI list (canonical INCI where resolved)
      if (uniqueInciList.length > 0) {
        const kbResult = await getIngredientKbMap(uniqueInciList);
        if (kbResult.error) {
          console.error('[FormulaCalculator] Error fetching ingredient KB:', kbResult.error);
        } else {
          // Normalize keys to lowercase for consistent lookup
          const normalizedKbMap: Record<string, IngredientKbRow> = {};
          for (const [key, value] of Object.entries(kbResult.data)) {
            const normalizedKey = key.trim().toLowerCase();
            normalizedKbMap[normalizedKey] = value;
          }
          setIngredientKbMap(normalizedKbMap);
          setSynonymMap(synonymMapping);
        }
      } else {
        setIngredientKbMap({});
        setSynonymMap(synonymMapping);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ingredients, customIngredients]);

  // Build resolved INCI list from ingredients (shared source for EU and IFRA compliance)
  const resolvedInciList = useMemo(() => {
    const canonicalInciList: string[] = [];
    const allAvailableIngredients = [...allIngredients, ...customIngredients];

    for (const ing of ingredients) {
      // Get full ingredient data to access INCI
      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());

      let originalInci: string | undefined;
      if (fullIngredient?.inci) {
        originalInci = fullIngredient.inci;
      } else if (ing.isCustom) {
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        originalInci = customIng?.inci || ing.name.trim();
      } else {
        originalInci = ing.name.trim();
      }

      // Resolve to canonical INCI using synonym map
      const norm = (s?: string) => (s ?? '').trim().toLowerCase();
      const keyInci = norm(originalInci);
      const keyName = norm(ing.name);
      const canonical = synonymMap[keyInci] || synonymMap[keyName] || originalInci;
      const canonicalKey = norm(canonical);

      if (canonicalKey && !canonicalInciList.includes(canonicalKey)) {
        canonicalInciList.push(canonicalKey);
      }
    }

    return canonicalInciList.length > 0 ? canonicalInciList : [];
  }, [ingredients, customIngredients, synonymMap]);

  // Debounced effect to fetch EU compliance data when formula ingredients change
  useEffect(() => {
    // Use shared resolved INCI list
    const canonicalInciList = resolvedInciList;
    const allAvailableIngredients = [...allIngredients, ...customIngredients];
    const resolvedIngredientsMap: Record<string, string> = {}; // ingredientId -> canonicalInci

    // Build resolved ingredients map for EU compliance check
    for (const ing of ingredients) {
      // Get full ingredient data to access INCI
      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());

      let originalInci: string | undefined;
      if (fullIngredient?.inci) {
        originalInci = fullIngredient.inci;
      } else if (ing.isCustom) {
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        originalInci = customIng?.inci || ing.name.trim();
      } else {
        originalInci = ing.name.trim();
      }

      // Resolve to canonical INCI using synonym map
      const norm = (s?: string) => (s ?? '').trim().toLowerCase();
      const keyInci = norm(originalInci);
      const keyName = norm(ing.name);
      const canonical = synonymMap[keyInci] || synonymMap[keyName] || originalInci;
      const canonicalKey = norm(canonical);

      // Store mapping for EU compliance check
      if (canonicalKey) {
        resolvedIngredientsMap[ing.id] = canonicalKey;
      }
    }

    // Debounce: wait 300ms before fetching
    const timeoutId = setTimeout(async () => {
      if (canonicalInciList.length === 0) {
        setEuComplianceMap({});
        setEuComplianceBlocks([]);
        return;
      }

      // Fetch EU compliance data
      const euResult = await getEuComplianceMap(canonicalInciList);
      if (euResult.error) {
        console.error('[FormulaCalculator] Error fetching EU compliance:', euResult.error);
        setEuComplianceMap({});
      } else {
        // Normalize keys to lowercase for consistent lookup
        const normalizedEuMap: Record<string, EuAnnexEntry[]> = {};
        for (const [key, value] of Object.entries(euResult.data)) {
          const normalizedKey = key.trim().toLowerCase();
          normalizedEuMap[normalizedKey] = value;
        }
        setEuComplianceMap(normalizedEuMap);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [resolvedInciList, ingredients, customIngredients, synonymMap]);

  // Build IFRA INCI list filtered to fragrance components only (using same resolution logic as IFRA matching)
  const ifraInciList = useMemo(() => {
    const inciList: string[] = [];
    const allAvailableIngredients = [...allIngredients, ...customIngredients];

    for (const ing of ingredients) {
      // Only include fragrance components
      if (ing.isFragranceComponent !== true) {
        continue;
      }

      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());

      let originalInci: string | undefined;
      if (fullIngredient?.inci) {
        originalInci = fullIngredient.inci;
      } else if (ing.isCustom) {
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        originalInci = customIng?.inci || ing.name.trim();
      } else {
        originalInci = ing.name.trim();
      }

      // Resolve to canonical INCI using synonym map
      const norm = (s?: string) => (s ?? '').trim().toLowerCase();
      const keyInci = norm(originalInci);
      const keyName = norm(ing.name);
      const canonical = synonymMap[keyInci] || synonymMap[keyName] || originalInci;

      // Normalize lookup key: take first INCI before comma, then normalize
      const firstInci = canonical ? canonical.split(',')[0] : '';
      const normalizedLookupKey = firstInci.trim().toLowerCase();

      if (normalizedLookupKey && !inciList.includes(normalizedLookupKey)) {
        inciList.push(normalizedLookupKey);
      }
    }

    return inciList;
  }, [ingredients, allIngredients, customIngredients, synonymMap]);

  // Debounced effect to fetch IFRA compliance data when formula ingredients change
  useEffect(() => {
    // Debounce: wait 300ms before fetching
    const timeoutId = setTimeout(async () => {
      if (ifraInciList.length === 0) {
        setIfraComplianceMap({});
        setIfraWarnings([]);
        return;
      }

      // Fetch IFRA compliance data
      const ifraResult = await getIfraComplianceMap(ifraInciList);
      if (ifraResult.error) {
        console.error('[FormulaCalculator] Error fetching IFRA compliance:', ifraResult.error);
        setIfraComplianceMap({});
        setIfraWarnings([]);
      } else {
        // Normalize keys to lowercase for consistent lookup
        const normalizedIfraMap: Record<string, IfraEntry[]> = {};
        for (const [key, value] of Object.entries(ifraResult.data)) {
          const normalizedKey = key.trim().toLowerCase();
          normalizedIfraMap[normalizedKey] = value;
        }
        setIfraComplianceMap(normalizedIfraMap);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ifraInciList]);

  // Process IFRA warnings: match ingredients with IFRA entries
  useEffect(() => {
    if (!ingredients || ingredients.length === 0) return;
    if (!ifraComplianceMap || Object.keys(ifraComplianceMap).length === 0) return;

    const allAvailableIngredients = [...allIngredients, ...customIngredients];
    const warnings: Array<{ ingredientName: string; inci: string; entries: IfraEntry[] }> = [];

    for (const ing of ingredients) {
      // Only process IFRA warnings for fragrance components
      if (ing.isFragranceComponent !== true) {
        continue;
      }
      
      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());

      let originalInci: string | undefined;
      if (fullIngredient?.inci) {
        originalInci = fullIngredient.inci;
      } else if (ing.isCustom) {
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        originalInci = customIng?.inci || ing.name.trim();
      } else {
        originalInci = ing.name.trim();
      }

      // Resolve to canonical INCI using synonym map
      const norm = (s?: string) => (s ?? '').trim().toLowerCase();
      const keyInci = norm(originalInci);
      const keyName = norm(ing.name);
      const canonical = synonymMap[keyInci] || synonymMap[keyName] || originalInci;

      // Normalize lookup key: take first INCI before comma, then normalize
      const firstInci = canonical ? canonical.split(',')[0] : '';
      const normalizedLookupKey = firstInci.trim().toLowerCase();
      
      
      if (normalizedLookupKey && ifraComplianceMap[normalizedLookupKey] && ifraComplianceMap[normalizedLookupKey].length > 0) {
        warnings.push({
          ingredientName: ing.name,
          inci: canonical,
          entries: ifraComplianceMap[normalizedLookupKey],
        });
      }
    }

    setIfraWarnings(warnings);
  }, [ingredients, ifraComplianceMap]);

  // Compute EU compliance blocks: run BEFORE safety warnings
  useEffect(() => {
    if (Object.keys(euComplianceMap).length === 0) {
      setEuComplianceBlocks([]);
      return;
    }

    // Build resolved ingredients list for EU compliance check
    const allAvailableIngredients = [...allIngredients, ...customIngredients];
    const resolvedIngredients: Array<{ id: string; name: string; percentage: number; canonicalInci: string }> = [];
    const resolvedIngredientsMap: Record<string, string> = {}; // ingredientId -> canonicalInci

    for (const ing of ingredients) {
      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());

      let originalInci: string | undefined;
      if (fullIngredient?.inci) {
        originalInci = fullIngredient.inci;
      } else if (ing.isCustom) {
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        originalInci = customIng?.inci || ing.name.trim();
      } else {
        originalInci = ing.name.trim();
      }

      // Resolve to canonical INCI using synonym map
      const norm = (s?: string) => (s ?? '').trim().toLowerCase();
      const keyInci = norm(originalInci);
      const keyName = norm(ing.name);
      const canonical = synonymMap[keyInci] || synonymMap[keyName] || originalInci;
      const canonicalKey = norm(canonical);

      if (canonicalKey) {
        resolvedIngredients.push({
          id: ing.id,
          name: ing.name,
          percentage: ing.percentage,
          canonicalInci: canonicalKey,
        });
        resolvedIngredientsMap[ing.id] = canonicalKey;
      }
    }

    // Run EU compliance check
    const complianceResult = checkEUCompliance(
      {
        ingredients: resolvedIngredients,
        productType: productType === 'leaveOn' ? 'leave-on' : 'rinse-off',
      },
      resolvedIngredientsMap,
      euComplianceMap
    );

    setEuComplianceBlocks(complianceResult.blocks);
  }, [ingredients, customIngredients, euComplianceMap, synonymMap, productType]);

  const total = ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);

  // Helper function to get max usage for an ingredient based on product type
  const getIngredientMaxUsageForProductType = (
    ingredient: IngredientData,
    productType: 'leaveOn' | 'rinseOff'
  ): number | null => {
    if (productType === 'leaveOn') {
      if (typeof ingredient.maxUsageLeaveOn === 'number') {
        return ingredient.maxUsageLeaveOn;
      } else if (typeof ingredient.maxUsage === 'number') {
        return ingredient.maxUsage;
      }
      return null;
    } else {
      // productType === 'rinseOff'
      if (typeof ingredient.maxUsageRinseOff === 'number') {
        return ingredient.maxUsageRinseOff;
      } else if (typeof ingredient.maxUsage === 'number') {
        return ingredient.maxUsage;
      }
      return null;
    }
  };

  // IFRA max usage enforcement for fragrance ingredients
  const ifraHardFail = useMemo(() => {
    const allAvailableIngredients = [...allIngredients, ...customIngredients];
    
    for (const ing of ingredients) {
      // Only check fragrance components
      if (ing.isFragranceComponent !== true) {
        continue;
      }

      // Check if ingredient has IFRA entries
      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());

      let originalInci: string | undefined;
      if (fullIngredient?.inci) {
        originalInci = fullIngredient.inci;
      } else if (ing.isCustom) {
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        originalInci = customIng?.inci || ing.name.trim();
      } else {
        originalInci = ing.name.trim();
      }

      // Resolve to canonical INCI using synonym map
      const norm = (s?: string) => (s ?? '').trim().toLowerCase();
      const keyInci = norm(originalInci);
      const keyName = norm(ing.name);
      const canonical = synonymMap[keyInci] || synonymMap[keyName] || originalInci;

      // Normalize lookup key: take first INCI before comma, then normalize
      const firstInci = canonical ? canonical.split(',')[0] : '';
      const normalizedLookupKey = firstInci.trim().toLowerCase();

      // Check if ingredient has IFRA entries
      if (!normalizedLookupKey || !ifraComplianceMap[normalizedLookupKey] || ifraComplianceMap[normalizedLookupKey].length === 0) {
        continue; // No IFRA data, skip
      }

      // Get max usage for current product type
      // TODO: When IFRA entries have max_leave_on/max_rinse_off fields, use those instead
      // For now, use ingredient's maxUsage from full ingredient data (structure allows easy swap later)
      let selectedMax: number | null = null;
      if (fullIngredient) {
        selectedMax = getIngredientMaxUsageForProductType(fullIngredient, productType);
      } else if (ing.maxUsage !== undefined) {
        // Fallback to ingredient's maxUsage if full ingredient not found
        selectedMax = ing.maxUsage;
      }
      
      if (selectedMax !== null && ing.percentage > selectedMax) {
        return { failed: true, max: selectedMax };
      }
    }

    return { failed: false, max: null };
  }, [ingredients, ifraComplianceMap, synonymMap, productType, customIngredients]);

  // EU Annex banned/prohibited ingredient hard-fail check
  const euBannedHardFail = useMemo(() => {
    // Check if any EU compliance block is Annex II (prohibited/banned)
    const bannedHits = euComplianceBlocks.filter(block => block.annex === 'II');
    return bannedHits.length > 0;
  }, [euComplianceBlocks]);

  // EU Annex III restricted ingredient hard-fail check (only when numeric max exists)
  const euRestrictedHardFail = useMemo(() => {
    // Filter for Annex III blocks with numeric max_percentage
    const restrictedHits = euComplianceBlocks.filter(
      block => block.annex === 'III' && 
               typeof block.max_percentage === 'number' && 
               block.max_percentage !== null
    );
    
    if (restrictedHits.length > 0) {
      // Return first failure (minimal)
      const firstHit = restrictedHits[0];
      return {
        failed: true,
        ingredientName: firstHit.ingredientName,
        max: firstHit.max_percentage as number,
      };
    }
    
    return { failed: false };
  }, [euComplianceBlocks]);

  // Unified hard-fail summary
  const hasHardFail = ifraHardFail.failed || euBannedHardFail || euRestrictedHardFail.failed;
  const hardFailReasons: string[] = [];
  if (euBannedHardFail) hardFailReasons.push("EU: banned ingredient present");
  if (euRestrictedHardFail.failed) hardFailReasons.push(`EU: restricted ingredient exceeds max (${euRestrictedHardFail.ingredientName} ${euRestrictedHardFail.max}%)`);
  if (ifraHardFail.failed) hardFailReasons.push(`IFRA: fragrance exceeds max (${ifraHardFail.max}%)`);

  // Calculate total batch cost
  const calculateTotalBatchCost = () => {
    return ingredients.reduce((sum, ing) => {
      if (ing.pricePerKg !== undefined && ing.pricePerKg > 0) {
        const weight = (ing.percentage * batchSize) / 100;
        return sum + (weight * ing.pricePerKg / 1000);
      }
      return sum;
    }, 0);
  };

  const totalBatchCost = calculateTotalBatchCost();
  const totalUnits = unitSize > 0 ? Math.floor(batchSize / unitSize) : 0;
  const costPerUnit = totalUnits > 0 ? totalBatchCost / totalUnits : 0;

  const getValidationStatus = () => {
    if (total > 100) return "INVALID";
    if (total < 100) return "INCOMPLETE";
    return "VALID";
  };

  const validationStatus = getValidationStatus();
  const statusColors = {
    INVALID: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", icon: "❌" },
    INCOMPLETE: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", icon: "⚠️" },
    VALID: { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-800", icon: "✅" },
  };
  const statusMessages = {
    INVALID: "Total exceeds 100%. Please reduce amounts.",
    INCOMPLETE: "Add more ingredients to reach 100%.",
    VALID: "Formula is balanced.",
  };

  // Compute safety warnings: DB-first, fallback to hardcoded rules
  const buildSafetyWarnings = (): (SafetyWarning & { source: 'DB' | 'Fallback' })[] => {
    const warnings: (SafetyWarning & { source: 'DB' | 'Fallback' })[] = [];
    const allAvailableIngredients = [...allIngredients, ...customIngredients];
    
    // Track which ingredients have been handled by DB warnings
    const dbHandledIngredientIds = new Set<string>();

    // Helper function to normalize strings for lookup
    const norm = (s?: string) => (s ?? '').trim().toLowerCase();

    // Step 1: Generate warnings from DB data
    for (const ing of ingredients) {
      // Get full ingredient data to access INCI
      const fullIngredient = ing.ingredientId 
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
      
      // Determine original INCI
      let originalInci: string | undefined;
      if (fullIngredient?.inci) {
        originalInci = fullIngredient.inci;
      } else if (ing.isCustom) {
        // For custom ingredients, check if we have INCI stored
        const customIng = customIngredients.find(ci => ci.name.toLowerCase() === ing.name.toLowerCase());
        originalInci = customIng?.inci || ing.name.trim();
      } else {
        // Unknown ingredient: use name directly
        originalInci = ing.name.trim();
      }

      const originalName = ing.name;

      // Normalize keys for lookup
      const keyInci = norm(originalInci);
      const keyName = norm(originalName);

      // Resolve to canonical INCI using synonym map (try INCI first, then name)
      // This works for both standard and custom ingredients - if a custom ingredient's
      // name or INCI resolves to a canonical INCI via ingredient_synonyms, use it
      const canonical = synonymMap[keyInci] || synonymMap[keyName] || originalInci;
      const canonicalKey = norm(canonical);

      // Look up KB data using normalized canonical INCI key
      // Custom ingredients with resolved canonical INCI will be found here
      const kbData = ingredientKbMap[canonicalKey];

      if (kbData) {
        const threshold = productType === 'leaveOn' 
          ? kbData.default_max_leave_on 
          : kbData.default_max_rinse_off;

        if (threshold !== null && threshold !== undefined && ing.percentage > threshold) {
          const excessPercent = ing.percentage - threshold;
          const excessRatio = (excessPercent / threshold) * 100;
          // >20% above threshold = critical, otherwise warning
          const severity: 'warning' | 'critical' = excessRatio > 20 ? 'critical' : 'warning';
          
          const categoryName = kbData.category || 'Unknown';
          warnings.push({
            id: `db:${ing.id}:${canonicalKey}`,
            severity,
            title: `${categoryName} Concentration`,
            message: kbData.notes || `Ingredient exceeds recommended maximum concentration (${threshold}%) for ${productType} products.`,
            ingredientId: ing.id,
            ingredientName: originalName, // Always show original ingredient name entered by user (e.g., "Euxyl PE 9010")
            category: categoryName,
            thresholdPercent: threshold,
            actualPercent: ing.percentage,
            source: 'DB',
          });
          // Mark this ingredient as handled by DB (including custom ingredients with resolved canonical INCI)
          dbHandledIngredientIds.add(ing.id);
        }
      }
    }

    // Step 2: Fallback to hardcoded rules for ingredients not handled by DB
    const ingredientsForFallback = ingredients
      .filter(ing => !dbHandledIngredientIds.has(ing.id))
      .map(ing => {
        const allAvailableIngredients = [...allIngredients, ...customIngredients];
        const fullIngredient = ing.ingredientId 
          ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
          : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
        
        return {
          id: ing.id,
          name: ing.name,
          percentage: ing.percentage,
          category: fullIngredient?.category,
          isVerified: fullIngredient?.isVerified,
          maxUsage: ing.maxUsage || fullIngredient?.maxUsage,
        };
      });

    const fallbackWarnings = evaluateSafetyWarnings(ingredientsForFallback, productType === 'leaveOn' ? 'leave-on' : 'rinse-off');
    
    // Add fallback warnings with source tag
    for (const warning of fallbackWarnings) {
      warnings.push({
        ...warning,
        source: 'Fallback',
      });
    }

    return warnings;
  };

  const safetyWarnings = buildSafetyWarnings();

  // Compute group max usage warnings for all categories
  const groupMaxUsageWarnings = useMemo(() => {
    const allAvailableIngredients = [...allIngredients, ...customIngredients].map(enrichIngredientWithKb);
    const warnings: Array<{ category: string; totalPercent: number; limitPercent: number }> = [];

    // Group ingredients by category
    const categoryGroups = new Map<string, Ingredient[]>();
    for (const ing of ingredients) {
      const fullIngredient = ing.ingredientId
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
      
      if (fullIngredient?.category) {
        const category = fullIngredient.category;
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, []);
        }
        categoryGroups.get(category)!.push(ing);
      }
    }

    // Compute warnings for each category group
    for (const [category, groupIngredients] of categoryGroups) {
      const totalPercent = groupIngredients.reduce((sum, ing) => sum + ing.percentage, 0);
      const maxUsageValues = groupIngredients
        .map(ing => {
          const fullIngredient = ing.ingredientId
            ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
            : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
          if (!fullIngredient) return null;
          return getIngredientMaxUsageForProductType(fullIngredient, productType);
        })
        .filter((maxUsage): maxUsage is number => maxUsage !== null && typeof maxUsage === 'number');

      const limitPercent = maxUsageValues.length > 0 ? Math.min(...maxUsageValues) : null;

      if (limitPercent !== null && totalPercent > limitPercent) {
        warnings.push({
          category,
          totalPercent,
          limitPercent,
        });
      }
    }

    return warnings;
  }, [ingredients, allIngredients, customIngredients, productType, ingredientKbMap]);

  const unverifiedIngredients = getUnverifiedIngredients(
    ingredients.map(ing => {
      const allAvailableIngredients = [...allIngredients, ...customIngredients];
      const fullIngredient = ing.ingredientId 
        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
      
      return {
        id: ing.id,
        name: ing.name,
        percentage: ing.percentage,
        category: fullIngredient?.category,
        isVerified: fullIngredient?.isVerified,
        maxUsage: ing.maxUsage || fullIngredient?.maxUsage,
      };
    })
  );


  const handleLoadFormula = (formula: SavedFormula) => {
    setFormulaName(formula.name);
    setIngredients(formula.ingredients);
    setBatchSize(formula.batchSize);
    setUnitSize(formula.unitSize || 50); // Default to 50 if not saved
    setProcedure(formula.procedure);
    setNotes(formula.notes || "");
    setProcessSteps(formula.processSteps || []);
    setShowLoadModal(false);
    // Reset sync states when loading
    setIsDirty(false);
    // Use savedAt timestamp if available, otherwise use current date
    setLastSavedAt(formula.savedAt ? new Date(formula.savedAt) : new Date());
    setSaveError(null);
  };

  const handleDeleteFormula = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading when clicking delete
    const ok = window.confirm("Delete this formula? This cannot be undone.");
    if (!ok) return;
    const updatedFormulas = savedFormulas.filter((f) => f.id !== id);
    setSavedFormulas(updatedFormulas);
    localStorage.setItem("saved_formulas", JSON.stringify(updatedFormulas));
  };

  const handleSaveCustomIngredient = () => {
    if (!newCustomIngredient.name.trim() || !newCustomIngredient.inci.trim()) {
      alert("Please enter all required data: Name and INCI must be filled.");
      return;
    }

    if (newCustomIngredient.minUsage >= newCustomIngredient.maxUsage) {
      alert("Min Usage must be less than Max Usage.");
      return;
    }

    // V1.9: Create custom ingredient and normalize for safety compliance
    const customIngredientRaw: IngredientData = {
      id: editingIngredientId || `custom-${Date.now()}`,
      name: newCustomIngredient.name.trim(),
      inci: newCustomIngredient.inci.trim(),
      category: newCustomIngredient.category as IngredientData['category'],
      subcategory: newCustomIngredient.subcategory.trim() || undefined,
      minUsage: newCustomIngredient.minUsage,
      maxUsage: newCustomIngredient.maxUsage,
      maxUsageLeaveOn: newCustomIngredient.maxUsageLeaveOn ?? null,
      maxUsageRinseOff: newCustomIngredient.maxUsageRinseOff ?? null,
      description: newCustomIngredient.description.trim() || `Custom ingredient: ${newCustomIngredient.name}`,
      averagePricePerKg: newCustomIngredient.averagePricePerKg > 0 ? newCustomIngredient.averagePricePerKg : 0,
      absorption: newCustomIngredient.absorption.trim() || undefined,
      comedogenicRating: newCustomIngredient.comedogenicRating,
      heatSensitive: newCustomIngredient.heatSensitive,
      productType: newCustomIngredient.productType,
      isCustom: true, // Flag to identify custom ingredients
    };
    
    // Apply safety normalization
    const customIngredient = normalizeCustomIngredient(customIngredientRaw);

    let updatedCustomIngredients: IngredientData[];
    if (editingIngredientId) {
      // Update existing ingredient
      updatedCustomIngredients = customIngredients.map(ing => 
        ing.id === editingIngredientId ? customIngredient : ing
      );
      setEditingIngredientId(null);
    } else {
      // Add new ingredient
      updatedCustomIngredients = [...customIngredients, customIngredient];
    }

    setCustomIngredients(updatedCustomIngredients);
    localStorage.setItem("custom_ingredients", JSON.stringify(updatedCustomIngredients));

    // Reset form and close modal
    setNewCustomIngredient({
      name: "",
      inci: "",
      averagePricePerKg: 0,
      category: "Lipid",
      subcategory: "",
      minUsage: 0.1,
      maxUsage: 100,
      maxUsageLeaveOn: undefined,
      maxUsageRinseOff: undefined,
      description: "",
      absorption: "",
      comedogenicRating: undefined,
      heatSensitive: false,
      productType: 'both',
    });
    setShowAdvancedLimits(false);
    setShowCustomModal(false);
  };

  const handleEditCustomIngredient = (ingredient: IngredientData) => {
    setNewCustomIngredient({
      name: ingredient.name,
      inci: ingredient.inci,
      averagePricePerKg: ingredient.averagePricePerKg,
      category: ingredient.category,
      subcategory: ingredient.subcategory || "",
      minUsage: ingredient.minUsage,
      maxUsage: ingredient.maxUsage,
      maxUsageLeaveOn: ingredient.maxUsageLeaveOn ?? undefined,
      maxUsageRinseOff: ingredient.maxUsageRinseOff ?? undefined,
      description: ingredient.description,
      absorption: ingredient.absorption || "",
      comedogenicRating: ingredient.comedogenicRating,
      heatSensitive: ingredient.heatSensitive || false,
      productType: ingredient.productType || 'both', // Backward compatibility: default to 'both' if missing
    });
    // Show advanced section if either field has a value
    setShowAdvancedLimits(ingredient.maxUsageLeaveOn != null || ingredient.maxUsageRinseOff != null);
    setEditingIngredientId(ingredient.id);
    setShowManageCustomModal(false);
    setShowCustomModal(true);
  };

  const handleDeleteCustomIngredient = (id: string) => {
    if (confirm("Are you sure you want to delete this custom ingredient?")) {
      const updatedCustomIngredients = customIngredients.filter(ing => ing.id !== id);
      setCustomIngredients(updatedCustomIngredients);
      localStorage.setItem("custom_ingredients", JSON.stringify(updatedCustomIngredients));
    }
  };

  // Helper function to normalize process step orders to 1..n
  const normalizeProcessStepOrders = (steps: ProcessStep[]): ProcessStep[] => {
    return steps
      .sort((a, b) => a.order - b.order)
      .map((step, index) => ({
        ...step,
        order: index + 1,
      }));
  };

  const handleAddProcessStep = () => {
    setEditingStepId(null);
    setNewProcessStep({
      title: "",
      phase: undefined,
      tempC: null,
      timeMin: null,
      description: "",
      notes: "",
    });
    setShowProcessStepModal(true);
  };

  const handleEditProcessStep = (step: ProcessStep) => {
    setEditingStepId(step.id);
    setNewProcessStep({
      title: step.title,
      phase: step.phase,
      tempC: step.tempC ?? null,
      timeMin: step.timeMin ?? null,
      description: step.description ?? "",
      notes: step.notes ?? "",
    });
    setShowProcessStepModal(true);
  };

  const handleSaveProcessStep = () => {
    if (!newProcessStep.title || newProcessStep.title.trim() === "") {
      alert("Title is required");
      return;
    }

    if (editingStepId) {
      // Update existing step
      const updatedSteps = processSteps.map((step) => {
        if (step.id === editingStepId) {
          return {
            ...step,
            title: newProcessStep.title!,
            phase: newProcessStep.phase,
            tempC: newProcessStep.tempC ?? null,
            timeMin: newProcessStep.timeMin ?? null,
            description: newProcessStep.description || undefined,
            notes: newProcessStep.notes || undefined,
          };
        }
        return step;
      });
      setProcessSteps(normalizeProcessStepOrders(updatedSteps));
    } else {
      // Add new step
      const newStep: ProcessStep = {
        id: crypto.randomUUID(),
        order: processSteps.length + 1,
        title: newProcessStep.title!,
        phase: newProcessStep.phase,
        tempC: newProcessStep.tempC ?? null,
        timeMin: newProcessStep.timeMin ?? null,
        description: newProcessStep.description || undefined,
        notes: newProcessStep.notes || undefined,
      };
      setProcessSteps(normalizeProcessStepOrders([...processSteps, newStep]));
    }

    // Reset form and close modal
    setEditingStepId(null);
    setNewProcessStep({
      title: "",
      phase: undefined,
      tempC: null,
      timeMin: null,
      description: "",
      notes: "",
    });
    setShowProcessStepModal(false);
    markDirty();
  };

  const handleDeleteProcessStep = (id: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      const updatedSteps = processSteps.filter((step) => step.id !== id);
      setProcessSteps(normalizeProcessStepOrders(updatedSteps));
      markDirty();
    }
  };

  const handleMoveStepUp = (id: string) => {
    const stepIndex = processSteps.findIndex((step) => step.id === id);
    if (stepIndex <= 0) return; // Already at top

    const updatedSteps = [...processSteps];
    [updatedSteps[stepIndex - 1], updatedSteps[stepIndex]] = [
      updatedSteps[stepIndex],
      updatedSteps[stepIndex - 1],
    ];
    setProcessSteps(normalizeProcessStepOrders(updatedSteps));
    markDirty();
  };

  const handleMoveStepDown = (id: string) => {
    const stepIndex = processSteps.findIndex((step) => step.id === id);
    if (stepIndex < 0 || stepIndex >= processSteps.length - 1) return; // Already at bottom

    const updatedSteps = [...processSteps];
    [updatedSteps[stepIndex], updatedSteps[stepIndex + 1]] = [
      updatedSteps[stepIndex + 1],
      updatedSteps[stepIndex],
    ];
    setProcessSteps(normalizeProcessStepOrders(updatedSteps));
    markDirty();
  };

  const handleApplyTemplate = (template: ProcessTemplate) => {
    // Deep copy steps, regenerate IDs, normalize order
    const newSteps: ProcessStep[] = template.steps.map((step, index) => ({
      ...step,
      id: crypto.randomUUID(),
      order: index + 1,
    }));

    setProcessSteps(newSteps);
    setShowTemplateSelector(false);
    markDirty();
  };

  const handleSelectTemplate = (template: ProcessTemplate) => {
    if (processSteps.length > 0) {
      const confirmed = window.confirm(
        `This will replace your current ${processSteps.length} process step(s) with the "${template.name}" template. Continue?`
      );
      if (!confirmed) {
        return;
      }
    }
    handleApplyTemplate(template);
  };

  const handleNewFormula = () => {
    // Check for unsaved changes
    if (isDirty) {
      const confirmed = window.confirm('Start a new formula? Unsaved changes will be lost.');
      if (!confirmed) {
        return;
      }
    }

    // Reset builder state to initial empty template
    setIngredients([]);
    setBatchSize(100);
    setUnitSize(50);
    setProcedure("");
    setNotes("");
    setFormulaName("Untitled");
    setProcessSteps([]);
    setWorkflowStatus('draft');
    setIsPinned(false);
    setOrganizationNotes('');
    
    // Clear currentFormulaId so next Save creates a NEW row (no upsert overwrite)
    setCurrentFormulaId(null);
    
    // Reset sync states
    setIsDirty(false);
    setIsFormulaDeleted(false);
    setLastSavedAt(null);
    setSaveError(null);
    setNotification(null);
    
    // Clear URL params by navigating to root
    router.push('/');
  };

  const handleDownloadPDF = () => {
    // Block PDF export if there are EU compliance blocks
    if (euComplianceBlocks.length > 0) {
      alert('Cannot export PDF: Formula contains EU compliance blocks. Please resolve all compliance issues before exporting.');
      return;
    }

    // Combine all ingredients (standard + custom) for lookup
    const allAvailableIngredients = [...allIngredients, ...customIngredients];
    
    // Look up full ingredient data for each ingredient in the formula
    const fullIngredientData = ingredients.map((ing) => {
      // Try to find the full ingredient data by ingredientId first, then by name
      let fullIngredient: IngredientData | undefined;
      
      if (ing.ingredientId) {
        fullIngredient = allAvailableIngredients.find((ai) => ai.id === ing.ingredientId);
      }
      
      // Fallback to name matching if ingredientId not found
      if (!fullIngredient) {
        fullIngredient = allAvailableIngredients.find(
          (ai) => ai.name.toLowerCase() === ing.name.toLowerCase()
        );
      }

      const weight = (ing.percentage / 100) * batchSize;
      const pricePerKg = ing.pricePerKg || fullIngredient?.averagePricePerKg || 0;

      // Return full data if found, otherwise use available data
      return {
        name: ing.name || "Unnamed Ingredient",
        inci: fullIngredient?.inci || "N/A",
        subcategory: fullIngredient?.subcategory,
        percentage: ing.percentage,
        weight: weight,
        phase: ing.phase || "A",
        pricePerKg: pricePerKg,
        isPremium: ing.isPremium || fullIngredient?.isPremium || false,
        isCustom: ing.isCustom || fullIngredient?.isCustom || false,
      };
    });

    // Calculate totals
    const totalPercentage = ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);

    // Generate the PDF using the new generator
    generateCosmeticFormulationReport(
      fullIngredientData,
      batchSize,
      procedure,
      notes,
      formulaName,
      unitSize,
      totalBatchCost,
      costPerUnit,
      totalPercentage
    );
  };

  const handleCloudSave = async () => {
    requireAuth(async () => {
      // BUSINESS-1: Free vs Paid gate - block save for free users
      if (!isPaidUser) {
        setNotification({ 
          type: 'error', 
          message: 'Saving formulas is available on the paid plan.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      setIsSaving(true);
      setSaveError(null);
      setNotification(null);
      
      // Auto-generate name if empty
      let nameToSave = formulaName.trim();
      if (!nameToSave) {
        // Generate default name: "Untitled — YYYY-MM-DD HH:mm"
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        nameToSave = `Untitled — ${year}-${month}-${day} ${hours}:${minutes}`;
        setFormulaName(nameToSave);
      }
      
      // BUSINESS-LEVEL GUARD: Validate before attempting save
      // Check for negative percentages
      const hasNegativePercentage = ingredients.some(ing => ing.percentage < 0);
      if (hasNegativePercentage) {
        setIsSaving(false);
        setSaveStatus('idle');
        setIsDirty(true); // Keep dirty state
        setNotification({ 
          type: 'error', 
          message: 'Invalid formula: ingredient percentage cannot be negative.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return; // Abort save
      }

      // Check for exact 100% total
      if (Math.abs(total - 100) > 0.01) { // Allow small floating point tolerance
        setIsSaving(false);
        setSaveStatus('idle');
        setIsDirty(true); // Keep dirty state
        setNotification({ 
          type: 'error', 
          message: 'Formula must total exactly 100% before saving.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return; // Abort save
      }

      // IFRA max usage enforcement: block save if fragrance exceeds IFRA limit
      if (ifraHardFail.failed) {
        setIsSaving(false);
        setSaveStatus('error');
        setIsDirty(true); // Keep dirty state
        setNotification({ 
          type: 'error', 
          message: `IFRA limit exceeded for Fragrance (max ${ifraHardFail.max}%).` 
        });
        setTimeout(() => setNotification(null), 5000);
        return; // Abort save
      }

      // EU Annex banned ingredient enforcement: block save if banned ingredient present
      if (euBannedHardFail) {
        setIsSaving(false);
        setSaveStatus('error');
        setIsDirty(true); // Keep dirty state
        setNotification({ 
          type: 'error', 
          message: 'EU compliance: banned ingredient present — saving disabled.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return; // Abort save
      }

      // EU Annex III restricted ingredient enforcement: block save if restricted ingredient exceeds numeric max
      if (euRestrictedHardFail.failed) {
        setIsSaving(false);
        setSaveStatus('error');
        setIsDirty(true); // Keep dirty state
        setNotification({ 
          type: 'error', 
          message: `EU compliance: restricted ingredient exceeds max (${euRestrictedHardFail.ingredientName} ${euRestrictedHardFail.max}%) — saving disabled.` 
        });
        setTimeout(() => setNotification(null), 5000);
        return; // Abort save
      }

      // Runtime guard: Check if formula still exists (if we have a currentFormulaId)
      if (currentFormulaId) {
        const { data: existingFormula, error: checkError } = await getFormulaById(currentFormulaId);
        if (checkError || !existingFormula) {
          setIsSaving(false);
          setSaveStatus('idle');
          
          // Reset builder to new empty formula state after deletion detected
          setIngredients([]);
          setBatchSize(100);
          setUnitSize(50);
          setProcedure("");
          setNotes("");
          setFormulaName("Untitled");
          setProcessSteps([]);
          setWorkflowStatus('draft');
          setIsPinned(false);
          setOrganizationNotes('');
          setCurrentFormulaId(null);
          setIsDirty(false);
          setIsFormulaDeleted(false);
          setLastSavedAt(null);
          setSaveError(null);
          setSavedAt(null);
          setNotification(null);
          
          return;
        }
      }

      // Set saving status before starting the actual save operation
      setSaveStatus('saving');

      try {
        // Prepare the formula data to save (full snapshot for formula_data)
        const formulaData = {
          ingredients: ingredients,
          batchSize: batchSize,
          unitSize: unitSize,
          procedure: procedure,
          notes: notes,
          processSteps: processSteps,
          total: total,
          totalBatchCost: totalBatchCost,
          costPerUnit: costPerUnit,
        };

        // Call the server action with new schema fields
        const result = await saveFormula({
          id: currentFormulaId || undefined,
          name: nameToSave,
          product_type: productType,
          batch_size: batchSize,
          formula_data: formulaData,
        });

        // SYNC STATUS INTEGRITY: Only update sync status AFTER database confirms a VALID save
        if (result && result.id) {
          setCurrentFormulaId(result.id);
          // Update URL with formula ID if it's a new formula or URL doesn't have it
          if (!currentFormulaId) {
            const currentPath = window.location.pathname;
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('id', result.id);
            router.replace(`${currentPath}?${searchParams.toString()}`, { scroll: false });
          }
          // Only mark as saved after successful database confirmation
          setIsDirty(false);
          setLastSavedAt(new Date());
          setSaveError(null);
          setSaveStatus('saved');
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          setSavedAt(`${hh}:${mm}`);
          setNotification({ type: 'success', message: 'Saved' });
          // Clear notification after 3 seconds
          setTimeout(() => setNotification(null), 3000);
          // Reset save status after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          throw new Error('Save operation completed but no formula ID was returned');
        }
      } catch (error) {
        // Error handling - show clear error message
        console.error("Error saving formula:", error);
        setIsDirty(true); // Keep dirty state - status must remain "Unsaved changes"
        setSaveError('Failed to save');
        setSaveStatus('error');
        setNotification({ type: 'error', message: 'Failed to save. Please check your connection.' });
        // Clear error notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleSaveAs = async () => {
    requireAuth(async () => {
      // BUSINESS-1: Free vs Paid gate - block save for free users
      if (!isPaidUser) {
        setNotification({ 
          type: 'error', 
          message: 'Saving formulas is available on the paid plan.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      setIsSaving(true);
      setSaveError(null);
      setNotification(null);
      
      // Prompt for new name (default: current name + " (copy)")
      const defaultName = formulaName.trim() ? `${formulaName.trim()} (copy)` : 'My New Formula (copy)';
      const promptName = prompt('Enter a name for the new formula:', defaultName);
      if (!promptName || !promptName.trim()) {
        setIsSaving(false);
        return; // User cancelled
      }
      const nameToSave = promptName.trim();
      
      // BUSINESS-LEVEL GUARD: Validate before attempting save
      // Check for negative percentages
      const hasNegativePercentage = ingredients.some(ing => ing.percentage < 0);
      if (hasNegativePercentage) {
        setIsSaving(false);
        setIsDirty(true);
        setNotification({ 
          type: 'error', 
          message: 'Invalid formula: ingredient percentage cannot be negative.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      // Check for exact 100% total
      if (Math.abs(total - 100) > 0.01) {
        setIsSaving(false);
        setIsDirty(true);
        setNotification({ 
          type: 'error', 
          message: 'Formula must total exactly 100% before saving.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      try {
        // Prepare the formula data to save
        const formulaData = {
          ingredients: ingredients,
          batchSize: batchSize,
          unitSize: unitSize,
          procedure: procedure,
          notes: notes,
          processSteps: processSteps,
          total: total,
          totalBatchCost: totalBatchCost,
          costPerUnit: costPerUnit,
        };

        // Call saveFormula WITHOUT currentFormulaId to create a new row
        const result = await saveFormula({
          // id is intentionally omitted to create a new formula
          name: nameToSave,
          product_type: productType,
          batch_size: batchSize,
          formula_data: formulaData,
        });

        if (result && result.id) {
          // Set the new formula ID and name
          setCurrentFormulaId(result.id);
          setFormulaName(nameToSave);
          setIsDirty(false);
          setLastSavedAt(new Date());
          setSaveError(null);
          setNotification({ type: 'success', message: 'Saved' });
          setTimeout(() => setNotification(null), 3000);
        } else {
          throw new Error('Save As operation completed but no formula ID was returned');
        }
      } catch (error) {
        console.error("Error saving formula:", error);
        setIsDirty(true);
        setSaveError('Failed to save');
        setNotification({ type: 'error', message: 'Failed to save. Please check your connection.' });
        setTimeout(() => setNotification(null), 5000);
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handlePrint = () => {
    // Helper to get INCI name from ingredient
    const getIngredientInci = (ingredient: Ingredient): string => {
      // Try to find the ingredient in the full ingredient list
      const allAvailableIngredients = [...allIngredients, ...customIngredients];
      const fullIngredient = allAvailableIngredients.find(
        (ing) => ing.name.toLowerCase() === ingredient.name.toLowerCase() || ing.id === ingredient.ingredientId
      );
      
      // Use INCI if available, otherwise use name
      if (fullIngredient?.inci) {
        return fullIngredient.inci;
      }
      
      // Try synonym map
      if (synonymMap[ingredient.name]) {
        return synonymMap[ingredient.name];
      }
      
      // Fallback to name
      return ingredient.name;
    };

    // Calculate total percentage
    const totalPercentage = ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);

    // Format date/time
    const now = new Date();
    const dateTime = now.toLocaleString();

    // Build ingredients list HTML
    const ingredientsList = ingredients
      .map((ing) => {
        const inci = getIngredientInci(ing);
        const displayName = inci !== ing.name ? `${ing.name} (${inci})` : ing.name;
        return `
          <tr class="ingredient-row">
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${displayName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${ing.percentage.toFixed(2)}%</td>
          </tr>
        `;
      })
      .join('');

    // Get product type display
    const productTypeDisplay = productType === 'leaveOn' ? 'Leave-On' : 'Rinse-Off';

    // Generate HTML document
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Formula: ${formulaName}</title>
  <style>
    @media print {
      @page {
        margin: 1in;
      }
      body {
        margin: 0;
      }
      /* Keep header block together */
      .header-block {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      /* Keep ingredient rows together */
      .ingredient-row {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      /* Keep table header with first row */
      thead {
        display: table-header-group;
      }
      tbody {
        display: table-row-group;
      }
      /* Prevent disclaimer from being orphaned */
      .disclaimer {
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-before: avoid;
        break-before: avoid;
      }
      /* Keep total row with last ingredient */
      .total-row {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      /* Keep compliance status block together */
      .compliance-status {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header-block {
      margin-bottom: 24px;
    }
    h1 {
      color: #0d9488;
      font-size: 24px;
      margin-bottom: 8px;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 8px;
    }
    .metadata {
      margin: 16px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .metadata-row {
      margin: 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    th {
      background-color: #f3f4f6;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #d1d5db;
    }
    th:last-child {
      text-align: right;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    td:last-child {
      text-align: right;
    }
    .total-row {
      font-weight: 600;
      background-color: #f9fafb;
      border-top: 2px solid #d1d5db;
    }
    .disclaimer {
      margin-top: 48px;
      padding: 16px;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      font-size: 12px;
      color: #92400e;
      line-height: 1.5;
    }
    .disclaimer-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .compliance-status {
      margin-top: 32px;
      padding: 16px;
      background-color: #f9fafb;
      border-left: 4px solid #6b7280;
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
    }
    .compliance-status.blocked {
      background-color: #fef2f2;
      border-left-color: #dc2626;
      color: #991b1b;
    }
    .compliance-status-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .compliance-status ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    .compliance-status li {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="header-block">
    <h1>${formulaName || 'Untitled Formula'}</h1>
    
    <div class="metadata">
      <div class="metadata-row"><strong>Date:</strong> ${dateTime}</div>
      <div class="metadata-row"><strong>Product Type:</strong> ${productTypeDisplay}</div>
      <div class="metadata-row"><strong>Batch Size:</strong> ${batchSize}g</div>
      ${unitSize > 0 ? `<div class="metadata-row"><strong>Package Size:</strong> ${unitSize}ml/g</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ingredient (INCI)</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${ingredientsList}
      <tr class="total-row">
        <td><strong>Total</strong></td>
        <td><strong>${totalPercentage.toFixed(2)}%</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="compliance-status ${hardFailReasons.length > 0 ? 'blocked' : ''}">
    <div class="compliance-status-title">Compliance Status</div>
    <div>
      ${hardFailReasons.length === 0 
        ? 'No blocking issues detected.' 
        : `BLOCKED<br><ul>${hardFailReasons.map(reason => `<li>${reason}</li>`).join('')}</ul>`}
    </div>
  </div>

  <div class="disclaimer">
    <div class="disclaimer-title">Disclaimer</div>
    <div>This tool provides informational guidance and does not constitute legal advice. Users are responsible for ensuring compliance with all applicable regulations.</div>
  </div>
</body>
</html>
    `;

    // Open new window and write HTML
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      // Use a small delay to ensure DOM is ready
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="w-full max-w-full md:max-w-6xl mx-auto px-4 md:px-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-6">Formula Calculator</h2>
          
          {/* Notification Banner */}
          {notification && (
            <div className={`mb-4 p-3 rounded-md border ${
              notification.type === 'success'
                ? 'bg-teal-50 border-teal-200 text-teal-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{notification.message}</p>
                <button
                  onClick={() => setNotification(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Onboarding Hint for Free Users */}
          {user && !isPaidUser && (
            <div className="mb-4 px-3 py-2 rounded-md border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600">
                <Info className="w-3 h-3 inline mr-1.5 text-gray-500" />
                Tip: You can Print/PDF export your formula anytime. Saving & dashboard access are available on Pro.{" "}
                <Link href="/pricing" className="text-teal-600 hover:text-teal-700 underline">
                  View plans
                </Link>
              </p>
            </div>
          )}
          
          {/* Header Grid - Clean 4-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Column 1: Formula Name */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <label htmlFor="formulaName" className="text-sm font-medium text-gray-700">
                  Formula Name
                </label>
                <Link
                  href="/dashboard"
                  className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
                >
                  My formulas
                </Link>
              </div>
              <input
                id="formulaName"
                type="text"
                value={formulaName}
                onChange={(e) => {
                  setFormulaName(e.target.value);
                  markDirty();
                }}
                className="w-full px-3 py-2 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="My New Formula"
              />
            </div>
            
            {/* Column 2: Batch Size */}
            <div className="flex flex-col gap-1 min-w-0">
              <label htmlFor="batchSizeTop" className="text-sm font-medium text-gray-700">
                Batch Size (g)
              </label>
              <input
                id="batchSizeTop"
                type="number"
                value={batchSize}
                onChange={(e) => {
                  setBatchSize(parseFloat(e.target.value) || 100);
                  markDirty();
                }}
                min="1"
                step="1"
                className="w-full px-3 py-2 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            
            {/* Column 3: Package Size */}
            <div className="flex flex-col gap-1 min-w-0">
              <label htmlFor="unitSizeTop" className="text-sm font-medium text-gray-700">
                Package Size (ml/g)
              </label>
              <input
                id="unitSizeTop"
                type="number"
                value={unitSize}
                onChange={(e) => {
                  setUnitSize(parseFloat(e.target.value) || 50);
                  markDirty();
                }}
                min="1"
                step="1"
                className="w-full px-3 py-2 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            
            {/* Column 4: Actions */}
            <div className="flex flex-col gap-1 items-end min-w-0 relative">
              <label className="text-sm font-medium text-gray-700">
                Actions
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCloudSave}
                  disabled={isSaving || isFormulaDeleted || !isPaidUser}
                  title={!isPaidUser ? "Upgrade to the paid plan to enable saving." : undefined}
                  className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
                {saveStatus !== 'idle' && (
                  <span className={`text-sm flex items-center ${
                    saveStatus === 'saving' ? 'text-gray-500' :
                    saveStatus === 'saved' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {saveStatus === 'saving' && 'Saving…'}
                    {saveStatus === 'saved' && 'Saved ✓'}
                    {saveStatus === 'error' && 'Error saving formula'}
                  </span>
                )}
                {savedAt && (
                  <span className="text-sm text-gray-500">
                    Saved at {savedAt}
                  </span>
                )}
                {isFormulaDeleted && (
                  <div className="mt-2 text-sm text-red-600 leading-relaxed">
                    This formula no longer exists.
                  </div>
                )}
                {hasHardFail && (
                  <div className="mt-2 text-sm text-red-600 leading-relaxed">
                    Cannot save: {hardFailReasons.join('; ')}.
                  </div>
                )}
                {!isPaidUser && (
                  <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                    Saving formulas is available on the paid plan. Upgrade to enable Save & Save As.{" "}
                    <Link href="/pricing" className="text-teal-600 hover:text-teal-700 underline">
                      View plans
                    </Link>
                  </div>
                )}
                {showUpgradeSuccess && (
                  <div className="mt-2 text-sm text-green-600 leading-relaxed">
                    Pro activated ✓
                  </div>
                )}
                <button
                  onClick={handleSaveAs}
                  disabled={isSaving || !isPaidUser}
                  title={!isPaidUser ? "Upgrade to the paid plan to enable saving." : undefined}
                  className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FilePlus className="w-4 h-4" />
                  Save As…
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  Print / PDF
                </button>
                <button
                  onClick={() => requireAuth(() => setShowLoadModal(true))}
                  className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-white border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium whitespace-nowrap"
                >
                  <FolderOpen className="w-4 h-4" />
                  Load
                </button>
              </div>
              {/* Status Badge - Absolutely positioned below buttons */}
              <div className="absolute top-full right-0 mt-1 flex justify-end">
                <span className={`text-xs ${isDirty ? 'text-amber-600' : 'text-gray-500'}`}>
                  {isDirty ? '● Unsaved changes' : 'Saved'}
                </span>
              </div>
            </div>
          </div>

          {/* Organization Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mt-4 pt-4 border-t border-gray-200">
            {/* Workflow Status */}
            <div className="flex flex-col gap-1 min-w-0">
              <label htmlFor="workflowStatus" className="text-sm font-medium text-gray-700">
                Workflow Status
              </label>
              <select
                id="workflowStatus"
                value={workflowStatus}
                onChange={(e) => {
                  setWorkflowStatus(e.target.value as 'draft' | 'testing' | 'final' | 'archived');
                  markDirty();
                }}
                className="w-full px-3 py-2 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="draft">Draft</option>
                <option value="testing">Testing</option>
                <option value="final">Final</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Product Type Selector */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProductType('leaveOn');
                    markDirty();
                  }}
                  className={`flex-1 px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm font-medium ${
                    productType === 'leaveOn'
                      ? 'bg-teal-50 border-teal-500 text-teal-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Leave-On
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductType('rinseOff');
                    markDirty();
                  }}
                  className={`flex-1 px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm font-medium ${
                    productType === 'rinseOff'
                      ? 'bg-teal-50 border-teal-500 text-teal-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Rinse-Off
                </button>
              </div>
            </div>

            {/* Pin Toggle */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsPinned(!isPinned);
                  markDirty();
                }}
                title="Pin this formula"
                className={`w-full px-3 py-2 min-h-[44px] border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                  isPinned
                    ? 'bg-teal-50 border-teal-500 text-teal-700 hover:bg-teal-100'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isPinned ? (
                  <>
                    <Pin className="w-4 h-4" />
                    Pinned
                  </>
                ) : (
                  <>
                    <PinOff className="w-4 h-4" />
                    Pin Formula
                  </>
                )}
              </button>
            </div>

            {/* Organization Notes */}
            <div className="flex flex-col gap-1 min-w-0 md:col-span-1 col-span-full">
              <label htmlFor="organizationNotes" className="text-sm font-medium text-gray-700">
                Notes
              </label>
              <input
                id="organizationNotes"
                type="text"
                value={organizationNotes}
                onChange={(e) => {
                  setOrganizationNotes(e.target.value);
                  markDirty();
                }}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Internal notes, reminders..."
              />
            </div>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="mb-4">
          <div className="overflow-x-auto w-full">
            <div className="flex gap-2 flex-nowrap pb-2">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "All"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("Lipid")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "Lipid"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Oils & Butters
              </button>
              <button
                onClick={() => setSelectedCategory("Emulsifier/Thickener")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "Emulsifier/Thickener"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Emulsifiers
              </button>
              <button
                onClick={() => setSelectedCategory("Active/Extract")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "Active/Extract"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Actives
              </button>
            </div>
          </div>
        </div>

        {/* Add Ingredient Buttons */}
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={addIngredient}
            className="flex items-center gap-2 px-6 py-2.5 h-10 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium whitespace-nowrap shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Ingredient
          </button>
          <button
            onClick={() => {
              setEditingIngredientId(null);
              setNewCustomIngredient({
                name: "",
                inci: "",
                averagePricePerKg: 0,
                category: "Lipid",
                subcategory: "",
                minUsage: 0.1,
                maxUsage: 100,
                maxUsageLeaveOn: undefined,
                maxUsageRinseOff: undefined,
                description: "",
                absorption: "",
                comedogenicRating: undefined,
                heatSensitive: false,
                productType: 'both',
              });
              setShowAdvancedLimits(false);
              setShowCustomModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 h-10 bg-white border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Custom Ingredient
          </button>
          {customIngredients.length > 0 && (
            <button
              onClick={() => setShowManageCustomModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 h-10 bg-white border-2 border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              Manage Custom ({customIngredients.length})
            </button>
          )}
          <button
            onClick={handleNewFormula}
            className="flex items-center gap-2 px-4 py-2.5 h-10 bg-white border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Formula
          </button>
        </div>

        {/* Onboarding Empty State Banner */}
        {ingredients.length === 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start your first professional formula</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-700">Add ingredients from our 2025 lab-grade database.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-700">Balance your phases to reach 100%.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-700">Generate your professional Lab Report.</p>
              </div>
            </div>
          </div>
        )}

        {ingredients.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <p className="mb-2 text-gray-700 font-medium">Start by adding ingredients, or load an example formula to see how it works.</p>
              <button
                onClick={loadExampleFormula}
                className="mt-4 px-6 py-2.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Load example formula
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="w-full min-w-[800px] sm:min-w-0">
              {/* Header Row - CSS Grid */}
              <div className="grid grid-cols-[80px_1fr_128px_128px_128px_128px_40px] border-b-2 border-gray-300 bg-gray-50">
                <div className="text-left py-3 px-4 font-semibold text-gray-700">Phase</div>
                <div className="text-left py-3 px-4 font-semibold text-gray-700">Name</div>
                <div className="text-left py-3 px-4 font-semibold text-gray-700">Percentage (%)</div>
                <div className="text-left py-3 px-4 font-semibold text-gray-700">Weight (g)</div>
                <div className="text-left py-3 px-4 font-semibold text-gray-700">Price per kg (€)</div>
                <div className="text-left py-3 px-4 font-semibold text-gray-700">Cost (€)</div>
                <div className="text-right py-3 px-4 font-semibold text-gray-700 flex items-center justify-end">
                  <Trash2 className="w-4 h-4 text-gray-500" aria-label="Action" />
                </div>
              </div>
              {/* Ingredient Rows */}
              <div>
                {[...ingredients]
                  .sort((a, b) => {
                    // Sort by phase: A, B, C, D, E
                    const phaseOrder = ["A", "B", "C", "D", "E"];
                    const aIndex = phaseOrder.indexOf(a.phase || "A");
                    const bIndex = phaseOrder.indexOf(b.phase || "A");
                    return aIndex - bIndex;
                  })
                  .map((ingredient) => {
                  const safetyError = getSafetyError(ingredient);
                  const isFocused = focusedIngredientId === ingredient.id;
                  // Compute suggestions based on the ingredient's current name value when focused
                  // Always use ingredient.name as it reflects what the user is currently typing
                  const suggestions = isFocused && showSuggestions 
                    ? getFilteredSuggestions(ingredient.name)
                    : [];
                  // Show dropdown whenever input is focused, showSuggestions is true, and there are suggestions
                  const shouldShowDropdown = isFocused && showSuggestions && suggestions.length > 0;
                  
                  // Resolve full ingredient data for max usage display
                  const allAvailableIngredients = [...allIngredients, ...customIngredients].map(enrichIngredientWithKb);
                  const fullIngredient = ingredient.ingredientId
                    ? allAvailableIngredients.find(ai => ai.id === ingredient.ingredientId)
                    : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ingredient.name.toLowerCase());
                  
                  // Format max usage display based on product type
                  const getMaxUsageDisplay = () => {
                    if (!fullIngredient) return null;
                    
                    const leave = typeof fullIngredient.maxUsageLeaveOn === 'number' ? fullIngredient.maxUsageLeaveOn : null;
                    const rinse = typeof fullIngredient.maxUsageRinseOff === 'number' ? fullIngredient.maxUsageRinseOff : null;
                    const legacy = typeof fullIngredient.maxUsage === 'number' ? fullIngredient.maxUsage : null;
                    
                    // Rule A: Both leave and rinse are valid numbers
                    if (leave !== null && rinse !== null) {
                      return `Max Usage: Leave-On ${leave}% • Rinse-Off ${rinse}%`;
                    }
                    
                    // Rule B: productType is leaveOn and leave is valid
                    if (productType === 'leaveOn' && leave !== null) {
                      return `Max Usage (Leave-On): ${leave}%`;
                    }
                    
                    // Rule C: productType is rinseOff and rinse is valid
                    if (productType === 'rinseOff' && rinse !== null) {
                      return `Max Usage (Rinse-Off): ${rinse}%`;
                    }
                    
                    // Rule D: legacy is valid
                    if (legacy !== null) {
                      return `Max Usage: ${legacy}% (fallback)`;
                    }
                    
                    // Rule E: Show nothing
                    return null;
                  };
                  
                  const maxUsageDisplay = getMaxUsageDisplay();

                  return (
                    <div key={ingredient.id} className="grid grid-cols-[80px_1fr_128px_128px_128px_128px_40px] border-b border-gray-100 hover:bg-gray-50">
                      <div className="py-3 px-4 align-top">
                        <select
                          value={ingredient.phase || "A"}
                          onChange={(e) =>
                            updateIngredient(ingredient.id, "phase", e.target.value)
                          }
                          className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                        </select>
                      </div>
                      <div className="py-3 px-4 align-top">
                        <div
                          className="relative flex flex-col items-start"
                          ref={(el) => {
                            dropdownRefs.current[ingredient.id] = el;
                          }}
                        >
                          <div className="relative w-full min-w-[120px] flex items-center gap-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              value={ingredient.name}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateIngredient(ingredient.id, "name", value);
                                // Immediately update search query to enable filtering
                                setSearchQuery(value);
                                setFocusedIngredientId(ingredient.id);
                                setShowSuggestions(true); // Always show suggestions when user types
                              }}
                              onFocus={() => {
                                setFocusedIngredientId(ingredient.id);
                                setSearchQuery(ingredient.name);
                                setShowSuggestions(true); // Show suggestions when input is focused
                              }}
                              onBlur={() => {
                                // Delay hiding to allow clicks on dropdown items
                                setTimeout(() => {
                                  setShowSuggestions(false);
                                }, 200);
                              }}
                              placeholder="Search ingredients..."
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={ingredient.isFragranceComponent || false}
                                onChange={(e) =>
                                  updateIngredient(ingredient.id, "isFragranceComponent", e.target.checked)
                                }
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                              />
                              <span className="text-sm text-gray-700">Fragrance</span>
                            </label>
                          </div>
                          {shouldShowDropdown && (
                            <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {suggestions.map((suggestion) => (
                                <li key={suggestion.id}>
                                  <button
                                    type="button"
                                    onClick={() => selectIngredient(ingredient.id, suggestion)}
                                    className="w-full text-left px-3 py-2 hover:bg-teal-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                      {suggestion.isCustom && (
                                        <span title="Custom ingredient">
                                          <User className="w-4 h-4 text-blue-500" />
                                        </span>
                                      )}
                                      {suggestion.name}
                                      {suggestion.isPremium && (
                                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <Sparkles className="w-3 h-3" />
                                          PREMIUM
                                        </span>
                                      )}
                                      {suggestion.subcategory && (
                                        <span className="text-gray-500 font-normal"> ({suggestion.subcategory})</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Max: {suggestion.maxUsage}% • {suggestion.description}
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {ingredient.isCustom && (
                            <div className="mt-1 flex items-center gap-1">
                              <User className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                CUSTOM
                              </span>
                            </div>
                          )}
                          {ingredient.isPremium && (
                            <div className="mt-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                PREMIUM
                              </span>
                            </div>
                          )}
                          {maxUsageDisplay && (
                            <div className="mt-1 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <span>{maxUsageDisplay}</span>
                                {!ingredient.isCustom && fullIngredient && (
                                  <span 
                                    className="flex items-center gap-1 text-gray-500"
                                    title="This ingredient uses predefined safety limits from the knowledge base. Leave-On / Rinse-Off limits cannot be edited."
                                  >
                                    <Lock className="w-3 h-3" />
                                    <span className="text-xs text-gray-500">KB limits</span>
                                  </span>
                                )}
                              </div>
                              {fullIngredient?.description && (
                                <span className="ml-2 text-gray-500">• {fullIngredient.description}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="py-3 px-4 align-top">
                        <div className="flex flex-col items-start">
                          <input
                            type="number"
                            value={ingredient.percentage || ""}
                            onChange={(e) => {
                              const rawValue = parseFloat(e.target.value);
                              // Clamp negative values to 0 - negative values must never propagate to state
                              const clampedValue = rawValue < 0 ? 0 : (rawValue || 0);
                              updateIngredient(
                                ingredient.id,
                                "percentage",
                                clampedValue
                              );
                            }}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            max="100"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              ingredient.percentage < 0 
                                ? "border-red-500 bg-red-50" 
                                : "border-gray-300"
                            }`}
                          />
                          {safetyError && (
                            <div className="mt-1 text-xs font-medium text-red-600">
                              {safetyError}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="py-3 px-4 align-top">
                        <div className="text-sm font-medium text-gray-700">
                          {((ingredient.percentage * batchSize) / 100).toFixed(2)}g
                        </div>
                      </div>
                      <div className="py-3 px-4 align-top">
                        <input
                          type="number"
                          value={ingredient.pricePerKg !== undefined ? ingredient.pricePerKg : ""}
                          onChange={(e) =>
                            updateIngredient(
                              ingredient.id,
                              "pricePerKg",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="py-3 px-4 align-top">
                        <div className="text-sm font-medium text-gray-700">
                          {ingredient.pricePerKg !== undefined && ingredient.pricePerKg > 0
                            ? `€${(((ingredient.percentage * batchSize) / 100) * ingredient.pricePerKg / 1000).toFixed(2)}`
                            : "—"}
                        </div>
                      </div>
                      <div className="py-3 px-4 text-right align-top">
                        <button
                          onClick={() => removeIngredient(ingredient.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          aria-label="Remove ingredient"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* Total Row */}
                <div className="grid grid-cols-[80px_1fr_128px_128px_128px_128px_40px] border-t-2 border-gray-300 bg-gray-50 font-semibold mt-6">
                  <div className="py-3 px-4"></div>
                  <div className="py-3 px-4"></div>
                  <div className="py-3 px-4"></div>
                  <div className="py-3 px-4"></div>
                  <div className="py-3 px-4 text-right text-gray-700">
                    Total Batch Cost:
                  </div>
                  <div className="py-3 px-4 text-sm font-bold text-teal-700">
                    €{totalBatchCost.toFixed(2)}
                  </div>
                  <div className="py-3 px-4"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Production Summary Section */}
        {ingredients.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-600" />
              Production Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Units</div>
                <div className="text-2xl font-bold text-gray-900">{totalUnits}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {batchSize}g ÷ {unitSize}ml/g
                </div>
              </div>
              <div className="bg-white rounded-md p-4 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1 font-medium">Total Batch Cost</div>
                <div className="text-2xl font-bold text-teal-700">€{totalBatchCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Professional cost analysis</div>
              </div>
              <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-md p-4 border-2 border-teal-300 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm text-gray-700 font-medium">Cost per Unit</div>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Business Insight
                  </span>
                </div>
                <div className="text-3xl font-bold text-teal-800">
                  €{costPerUnit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {totalBatchCost > 0 && totalUnits > 0 
                    ? `€${totalBatchCost.toFixed(2)} ÷ ${totalUnits} units`
                    : 'Enter ingredients and prices'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className={`p-4 rounded-md border-2 ${statusColors[validationStatus].border} ${statusColors[validationStatus].bg}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">Total:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{total.toFixed(2)}%</span>
                    <div className={`px-3 py-1 rounded-full border-2 ${statusColors[validationStatus].border} ${statusColors[validationStatus].bg} ${statusColors[validationStatus].text} font-semibold text-sm`}>
                      <span className="mr-2">{statusColors[validationStatus].icon}</span>
                      {validationStatus}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium">
                  {statusMessages[validationStatus]}
                </div>
                <div className="mt-3 text-xs text-gray-600 italic">
                  <span className="font-semibold">Lab Tip:</span> Professional creams typically contain 60–75% water phase.
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4 md:mt-0">
                <div className="flex flex-col items-start md:items-end gap-1">
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={validationStatus === "INVALID" || euComplianceBlocks.length > 0}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 h-10 border-2 border-teal-600 rounded-md transition-colors font-medium whitespace-nowrap ${
                        validationStatus === "INVALID" || euComplianceBlocks.length > 0
                          ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                          : "bg-white text-teal-600 hover:bg-teal-50"
                      }`}
                      title={euComplianceBlocks.length > 0 ? "Cannot export: EU compliance blocks present" : undefined}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Generate Lab Report (PDF)</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-left md:text-right mt-1">
                    Professional document ready for production, partners & compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How this works - Help Button */}
        <div className="mt-8 mb-4 flex justify-end">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            How this works
          </button>
        </div>

        {/* EU Compliance Blocks Section */}
        {euComplianceBlocks.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              EU Compliance Blocks
            </h3>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  EU compliance checks are informational and based on Annex II, III, and VI of the EU Cosmetics Regulation. Final regulatory compliance must always be verified against the official regulation and supplier documentation.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {euComplianceBlocks.map((block) => {
                // Determine severity and styling based on annex type
                const isProhibited = block.annex === 'II';
                const severityLabel = isProhibited ? 'EU Prohibited' : 'EU Restriction';
                const severityDescription = isProhibited 
                  ? 'This ingredient is prohibited and cannot be used in cosmetic products.'
                  : 'This ingredient exceeds the maximum allowed concentration.';
                
                const annexColors = {
                  II: { 
                    bg: 'bg-red-50', 
                    border: 'border-red-500', 
                    text: 'text-red-900', 
                    badge: 'bg-red-600 text-white',
                    severityBadge: 'bg-red-700 text-white'
                  },
                  III: { 
                    bg: 'bg-orange-50', 
                    border: 'border-orange-400', 
                    text: 'text-orange-900', 
                    badge: 'bg-orange-200 text-orange-800',
                    severityBadge: 'bg-orange-600 text-white'
                  },
                  VI: { 
                    bg: 'bg-amber-50', 
                    border: 'border-amber-400', 
                    text: 'text-amber-900', 
                    badge: 'bg-amber-200 text-amber-800',
                    severityBadge: 'bg-amber-600 text-white'
                  },
                };
                const style = annexColors[block.annex];

                return (
                  <div
                    key={block.id}
                    className={`p-4 rounded-md border-2 ${style.bg} ${style.border} ${isProhibited ? 'ring-2 ring-red-300' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 ${style.text} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 space-y-2">
                        {/* Header with severity and annex */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.severityBadge} uppercase tracking-wide`}>
                            {severityLabel}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${style.badge} border border-current`}>
                            Annex {block.annex}
                          </span>
                        </div>
                        
                        {/* Ingredient name and INCI */}
                        <div className={`text-sm font-semibold ${style.text}`}>
                          <span className="font-bold">{block.ingredientName}</span>
                          {block.inci_canonical && (
                            <span className="text-gray-600 font-normal ml-2">({block.inci_canonical})</span>
                          )}
                        </div>
                        
                        {/* Severity description */}
                        <div className={`text-sm ${style.text} font-medium`}>
                          {severityDescription}
                        </div>
                        
                        {/* Detailed reason/explanation */}
                        <div className={`text-sm ${style.text}`}>
                          {block.reason}
                        </div>
                        
                        {/* Percentage details (if applicable) */}
                        {block.max_percentage !== null && (
                          <div className="text-sm font-medium text-gray-700 bg-white/50 px-3 py-2 rounded border border-gray-200">
                            <span className="font-semibold">Concentration Limit:</span> Maximum allowed {block.max_percentage}% • 
                            Formula contains <span className="font-bold text-red-700">{block.actual_percentage.toFixed(2)}%</span>
                          </div>
                        )}
                        
                        {/* Conditions (if any) */}
                        {block.conditions_text && (
                          <div className="text-xs text-gray-700 bg-white/50 px-3 py-2 rounded border border-gray-200 italic">
                            <span className="font-semibold not-italic">Additional Conditions:</span> {block.conditions_text}
                          </div>
                        )}
                        
                        {/* Reference link */}
                        {block.reference_url && (
                          <div className="text-xs">
                            <a
                              href={block.reference_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              View EU Regulation Reference →
                            </a>
                          </div>
                        )}
                        
                        {/* Source (if available) */}
                        {block.source && (
                          <div className="text-xs text-gray-500">
                            Source: {block.source}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-800">
                <strong>Note:</strong> Formulas with EU compliance blocks cannot be exported to PDF. Please resolve all compliance issues before exporting.
              </p>
            </div>
          </div>
        )}

        {/* IFRA Informational Warnings Section */}
        {ifraWarnings.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              IFRA Guidance (Informational)
            </h3>
            <div className="space-y-3">
              {ifraWarnings.map((warning, idx) => (
                <div
                  key={`${warning.ingredientName}-${idx}`}
                  className="p-4 rounded-md border-2 bg-blue-50 border-blue-300"
                >
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900 mb-1">
                        <strong>{warning.ingredientName}</strong> ({warning.inci})
                      </div>
                      <div className="text-sm text-blue-900 mb-2">
                        This ingredient has {warning.entries.length} IFRA standard{warning.entries.length > 1 ? 's' : ''} associated with it.
                      </div>
                      <div className="space-y-2 mt-3">
                        {warning.entries.map((entry, entryIdx) => (
                          <div key={entryIdx} className="text-sm text-blue-800 bg-blue-100 p-2 rounded border border-blue-200">
                            <div className="font-medium mb-1">
                              {entry.standard_name}
                            </div>
                            <div className="text-xs text-blue-700 space-y-1">
                              <div>
                                <span className="font-semibold">Type:</span> {entry.ifra_standard_type}
                              </div>
                              <div>
                                <span className="font-semibold">Amendment:</span> {entry.amendment_number}
                              </div>
                              {entry.reference_url && (
                                <div>
                                  <a
                                    href={entry.reference_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View IFRA Standard Reference
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> IFRA standards provide industry guidance for fragrance ingredients.
                These warnings are <strong>informational only</strong> and do not block formulation.
              </p>
              <p className="text-xs text-blue-700 mt-2 italic">
                Final compliance assessment must be performed by the Responsible Person.
              </p>
            </div>
          </div>
        )}

        {/* Max Usage (Group) Warning Section */}
        {groupMaxUsageWarnings.length > 0 && (
          <div className="mt-8">
            <div className="space-y-3">
              {groupMaxUsageWarnings.map((warning, idx) => (
                <div key={idx} className="p-4 bg-amber-50 border-2 border-amber-300 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-amber-900 mb-1">Max Usage (Group) Warning</div>
                      <div className="text-sm text-amber-800">
                        {warning.category} total: {warning.totalPercent.toFixed(2)}% (recommended max: {warning.limitPercent.toFixed(2)}%). Consider reducing total concentration in this category.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Summary Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => setShowExportSummaryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
          >
            <Briefcase className="w-4 h-4" />
            Compliance Summary
          </button>
        </div>

        {/* Safety Warnings Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Warnings</h3>
          
          {/* Unverified Ingredients Banner */}
          {unverifiedIngredients.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-900 mb-1">Unverified Ingredients</div>
                  <div className="text-sm text-amber-800">
                    The following ingredients need verification: {unverifiedIngredients.map(ing => ing.name).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Safety Warnings List */}
          {safetyWarnings.length > 0 ? (
            <div className="space-y-3">
              {safetyWarnings.map((warning: SafetyWarning & { source: 'DB' | 'Fallback' }) => {
                const severityStyles = {
                  info: {
                    bg: 'bg-blue-50',
                    border: 'border-blue-300',
                    text: 'text-blue-900',
                    icon: Info,
                  },
                  warning: {
                    bg: 'bg-amber-50',
                    border: 'border-amber-300',
                    text: 'text-amber-900',
                    icon: AlertTriangle,
                  },
                  critical: {
                    bg: 'bg-red-50',
                    border: 'border-red-300',
                    text: 'text-red-900',
                    icon: AlertCircle,
                  },
                };
                const style = severityStyles[warning.severity];
                const Icon = style.icon;

                return (
                  <div
                    key={warning.id}
                    className={`p-4 rounded-md border-2 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${style.text} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <div className={`font-semibold ${style.text} mb-1 flex items-center gap-2 flex-wrap`}>
                          {warning.title}
                          {warning.ingredientName && (
                            <span className="font-normal text-gray-700"> • {warning.ingredientName}</span>
                          )}
                          {warning.source && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              warning.source === 'DB' 
                                ? 'bg-teal-100 text-teal-700 border border-teal-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}>
                              {warning.source}
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${style.text} mb-2`}>
                          {warning.message}
                        </div>
                        {warning.thresholdPercent !== undefined && warning.actualPercent !== undefined && (
                          <div className="text-xs text-gray-600 mt-2">
                            Threshold: {warning.thresholdPercent}% • Actual: {warning.actualPercent.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
              No safety warnings
            </div>
          )}
        </div>

        {/* Formulation Notes Section */}
        <div className="mt-8">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Formulation Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              markDirty();
            }}
            placeholder="e.g., Target pH 5.5, intended for dry skin, added more wax because V1 was too runny..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y text-sm"
          />
        </div>

        {/* Manufacturing Procedure Section */}
        <div className="mt-8">
          <label htmlFor="procedure" className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturing Procedure
          </label>
          <textarea
            id="procedure"
            value={procedure}
            onChange={(e) => {
              setProcedure(e.target.value);
              markDirty();
            }}
            placeholder={`1. Heat Phase A to 70°C...
2. Mix Phase B...
3. Add Phase C at room temperature...`}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y text-sm"
          />
        </div>

        {/* Process Steps Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Process / Steps
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Start from template
              </button>
              <button
                onClick={handleAddProcessStep}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>
          </div>

          {processSteps.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-sm">No process steps added yet.</p>
              <p className="text-xs mt-1">Click "Add Step" to create a process step.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {processSteps
                .sort((a, b) => a.order - b.order)
                .map((step) => {
                  const metaParts: string[] = [];
                  if (step.phase) metaParts.push(`Phase ${step.phase}`);
                  if (step.tempC !== null && step.tempC !== undefined) {
                    metaParts.push(`${step.tempC}°C`);
                  }
                  if (step.timeMin !== null && step.timeMin !== undefined) {
                    metaParts.push(`${step.timeMin} min`);
                  }
                  const metaLine = metaParts.length > 0 ? metaParts.join(" • ") : null;

                  return (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 p-4 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold text-sm mt-0.5">
                        {step.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{step.title}</div>
                        {metaLine && (
                          <div className="text-xs text-gray-500 mt-1">{metaLine}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveStepUp(step.id)}
                          disabled={step.order === 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                          aria-label="Move up"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveStepDown(step.id)}
                          disabled={step.order === processSteps.length}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                          aria-label="Move down"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditProcessStep(step)}
                          className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                          aria-label="Edit step"
                          title="Edit step"
                        >
                          <span className="text-sm font-medium">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProcessStep(step.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          aria-label="Delete step"
                          title="Delete step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-xs text-gray-500 leading-relaxed">
          Disclaimer: FormulaGuard provides informational guidance only.
          It does not replace regulatory review or professional safety assessment.
          You are responsible for compliance with applicable laws and regulations.
        </div>

        {/* Load Formula Modal */}
        {showLoadModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowLoadModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Load Saved Formula</h3>
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4">
                {savedFormulas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No saved formulas yet.</p>
                    <p className="text-sm mt-2">Save a formula to see it here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...savedFormulas]
                      .sort((a, b) => b.savedAt - a.savedAt) // Sort by date, newest first
                      .map((formula) => (
                      <div
                        key={formula.id}
                        onClick={() => handleLoadFormula(formula)}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-teal-50 hover:border-teal-300 cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{formula.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formula.ingredients.length} ingredient{formula.ingredients.length !== 1 ? "s" : ""} • Batch: {formula.batchSize}g • Saved: {new Date(formula.savedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteFormula(formula.id, e)}
                          className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          aria-label="Delete formula"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Ingredient Modal */}
        {showCustomModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
            onClick={() => {
              setShowCustomModal(false);
              setEditingIngredientId(null);
              setNewCustomIngredient({
                name: "",
                inci: "",
                averagePricePerKg: 0,
                category: "Lipid",
                subcategory: "",
                minUsage: 0.1,
                maxUsage: 100,
                maxUsageLeaveOn: undefined,
                maxUsageRinseOff: undefined,
                description: "",
                absorption: "",
                comedogenicRating: undefined,
                heatSensitive: false,
                productType: 'both',
              });
              setShowAdvancedLimits(false);
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingIngredientId ? "Edit Custom Ingredient" : "Add Custom Ingredient"}
                </h3>
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setEditingIngredientId(null);
                    setNewCustomIngredient({
                      name: "",
                      inci: "",
                      averagePricePerKg: 0,
                      category: "Lipid",
                      subcategory: "",
                      minUsage: 0.1,
                      maxUsage: 100,
                      maxUsageLeaveOn: undefined,
                      maxUsageRinseOff: undefined,
                      description: "",
                      absorption: "",
                      comedogenicRating: undefined,
                      heatSensitive: false,
                      productType: 'both',
                    });
                    setShowAdvancedLimits(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="customName" className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredient Name *
                    </label>
                    <input
                      id="customName"
                      type="text"
                      value={newCustomIngredient.name}
                      onChange={(e) =>
                        setNewCustomIngredient({ ...newCustomIngredient, name: e.target.value })
                      }
                      placeholder="e.g. My Special Oil"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="customInci" className="block text-sm font-medium text-gray-700 mb-2">
                      INCI Name *
                    </label>
                    <input
                      id="customInci"
                      type="text"
                      value={newCustomIngredient.inci}
                      onChange={(e) =>
                        setNewCustomIngredient({ ...newCustomIngredient, inci: e.target.value })
                      }
                      placeholder="e.g. Helianthus Annuus (Sunflower) Seed Oil"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="customCategory"
                      value={newCustomIngredient.category}
                      onChange={(e) =>
                        setNewCustomIngredient({ ...newCustomIngredient, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="Lipid">Lipid</option>
                      <option value="Emulsifier/Thickener">Emulsifier/Thickener</option>
                      <option value="Active/Extract">Active/Extract</option>
                      <option value="Preservative">Preservative</option>
                      <option value="Stabilizer">Stabilizer</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="customProductType" className="block text-sm font-medium text-gray-700 mb-2">
                      Product Type *
                    </label>
                    <select
                      id="customProductType"
                      value={newCustomIngredient.productType}
                      onChange={(e) =>
                        setNewCustomIngredient({ ...newCustomIngredient, productType: e.target.value as 'leave-on' | 'rinse-off' | 'both' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="leave-on">Leave-on</option>
                      <option value="rinse-off">Rinse-off</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="customSubcategory" className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory
                    </label>
                    <input
                      id="customSubcategory"
                      type="text"
                      value={newCustomIngredient.subcategory}
                      onChange={(e) =>
                        setNewCustomIngredient({ ...newCustomIngredient, subcategory: e.target.value })
                      }
                      placeholder="e.g. Carrier Oil, Emulsifier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="customMinUsage" className="block text-sm font-medium text-gray-700 mb-2">
                      Min Usage (%)
                    </label>
                    <input
                      id="customMinUsage"
                      type="number"
                      value={newCustomIngredient.minUsage}
                      onChange={(e) =>
                        setNewCustomIngredient({
                          ...newCustomIngredient,
                          minUsage: parseFloat(e.target.value) || 0.1,
                        })
                      }
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="customMaxUsage" className="block text-sm font-medium text-gray-700 mb-2">
                      Max Usage (%) *
                    </label>
                    <input
                      id="customMaxUsage"
                      type="number"
                      value={newCustomIngredient.maxUsage}
                      onChange={(e) =>
                        setNewCustomIngredient({
                          ...newCustomIngredient,
                          maxUsage: parseFloat(e.target.value) || 100,
                        })
                      }
                      step="0.1"
                      min="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used as fallback if Leave-On / Rinse-Off limits are not specified.
                    </p>
                  </div>
                  
                  {/* Advanced Limits Section */}
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedLimits(!showAdvancedLimits)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    >
                      <div className="flex flex-col items-start">
                        <span>Advanced (Leave-On / Rinse-Off)</span>
                        <span className="text-xs text-gray-500 font-normal">Available for custom ingredients only.</span>
                      </div>
                      {showAdvancedLimits ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {showAdvancedLimits && (
                      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-md space-y-4">
                        <p className="text-xs text-gray-600 mb-3">
                          Optional. Use only if limits differ by product type.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="customMaxUsageLeaveOn" className="block text-sm font-medium text-gray-700 mb-2">
                              Max Usage – Leave-On (%)
                            </label>
                            <input
                              id="customMaxUsageLeaveOn"
                              type="number"
                              value={newCustomIngredient.maxUsageLeaveOn ?? ""}
                              onChange={(e) =>
                                setNewCustomIngredient({
                                  ...newCustomIngredient,
                                  maxUsageLeaveOn: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              step="0.1"
                              min="0"
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="customMaxUsageRinseOff" className="block text-sm font-medium text-gray-700 mb-2">
                              Max Usage – Rinse-Off (%)
                            </label>
                            <input
                              id="customMaxUsageRinseOff"
                              type="number"
                              value={newCustomIngredient.maxUsageRinseOff ?? ""}
                              onChange={(e) =>
                                setNewCustomIngredient({
                                  ...newCustomIngredient,
                                  maxUsageRinseOff: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              step="0.1"
                              min="0"
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="customPrice" className="block text-sm font-medium text-gray-700 mb-2">
                      Price (€/kg)
                    </label>
                    <input
                      id="customPrice"
                      type="number"
                      value={newCustomIngredient.averagePricePerKg || ""}
                      onChange={(e) =>
                        setNewCustomIngredient({
                          ...newCustomIngredient,
                          averagePricePerKg: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="customAbsorption" className="block text-sm font-medium text-gray-700 mb-2">
                      Absorption
                    </label>
                    <select
                      id="customAbsorption"
                      value={newCustomIngredient.absorption}
                      onChange={(e) =>
                        setNewCustomIngredient({ ...newCustomIngredient, absorption: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">N/A</option>
                      <option value="Very Fast">Very Fast</option>
                      <option value="Fast">Fast</option>
                      <option value="Medium">Medium</option>
                      <option value="Slow">Slow</option>
                      <option value="Very Slow">Very Slow</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="customComedogenic" className="block text-sm font-medium text-gray-700 mb-2">
                      Comedogenic Rating (0-5)
                    </label>
                    <input
                      id="customComedogenic"
                      type="number"
                      value={newCustomIngredient.comedogenicRating || ""}
                      onChange={(e) =>
                        setNewCustomIngredient({
                          ...newCustomIngredient,
                          comedogenicRating: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      min="0"
                      max="5"
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      id="customHeatSensitive"
                      type="checkbox"
                      checked={newCustomIngredient.heatSensitive}
                      onChange={(e) =>
                        setNewCustomIngredient({
                          ...newCustomIngredient,
                          heatSensitive: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="customHeatSensitive" className="text-sm font-medium text-gray-700">
                      Heat Sensitive
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="customDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="customDescription"
                      value={newCustomIngredient.description}
                      onChange={(e) =>
                        setNewCustomIngredient({ ...newCustomIngredient, description: e.target.value })
                      }
                      placeholder="Describe the ingredient's properties and benefits..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setEditingIngredientId(null);
                    setNewCustomIngredient({
                      name: "",
                      inci: "",
                      averagePricePerKg: 0,
                      category: "Lipid",
                      subcategory: "",
                      minUsage: 0.1,
                      maxUsage: 100,
                      maxUsageLeaveOn: undefined,
                      maxUsageRinseOff: undefined,
                      description: "",
                      absorption: "",
                      comedogenicRating: undefined,
                      heatSensitive: false,
                      productType: 'both',
                    });
                    setShowAdvancedLimits(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomIngredient}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
                >
                  {editingIngredientId ? "Update" : "Save"} Ingredient
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Custom Ingredients Modal */}
        {showManageCustomModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowManageCustomModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Manage Custom Ingredients</h3>
                <button
                  onClick={() => setShowManageCustomModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4">
                {customIngredients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No custom ingredients yet.</p>
                    <p className="text-sm mt-2">Add a custom ingredient to see it here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customIngredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-900">{ingredient.name}</span>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              CUSTOM
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">INCI:</span> {ingredient.inci}
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>
                              <span className="font-medium">Category:</span> {ingredient.category}
                              {ingredient.subcategory && ` • ${ingredient.subcategory}`}
                            </div>
                            <div>
                              <span className="font-medium">Usage:</span> {ingredient.minUsage}% - {ingredient.maxUsage}%
                              {ingredient.absorption && ` • Absorption: ${ingredient.absorption}`}
                              {ingredient.comedogenicRating !== undefined && ` • Comedogenic: ${ingredient.comedogenicRating}`}
                              {ingredient.heatSensitive && ` • Heat Sensitive`}
                            </div>
                            <div>
                              <span className="font-medium">Price:</span> {ingredient.averagePricePerKg > 0 ? `€${ingredient.averagePricePerKg}/kg` : "—"}
                            </div>
                            {ingredient.description && (
                              <div className="mt-1 text-gray-600">{ingredient.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditCustomIngredient(ingredient)}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            aria-label="Edit ingredient"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCustomIngredient(ingredient.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            aria-label="Delete ingredient"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowManageCustomModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Summary Modal */}
        {showExportSummaryModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowExportSummaryModal(false);
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Compliance Summary</h2>
                <button
                  onClick={() => setShowExportSummaryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 flex-1">
                {/* Header Section */}
                <div className="mb-6 space-y-2">
                  <div className="text-lg font-semibold text-gray-900">{formulaName}</div>
                  <div className="text-sm text-gray-600">
                    Product Type: <span className="font-medium">{productType === 'leaveOn' ? 'Leave-On' : 'Rinse-Off'}</span>
                    {batchSize > 0 && (
                      <span className="ml-4">
                        Batch Size: <span className="font-medium">{batchSize}g</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ingredients Table */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Ingredients</h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">INCI</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">%</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Category</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Max Usage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ingredients.map((ing) => {
                          const allAvailableIngredients = [...allIngredients, ...customIngredients].map(enrichIngredientWithKb);
                          const fullIngredient = ing.ingredientId
                            ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
                            : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
                          
                          const getMaxUsageDisplay = () => {
                            if (!fullIngredient) return '—';
                            const leave = typeof fullIngredient.maxUsageLeaveOn === 'number' ? fullIngredient.maxUsageLeaveOn : null;
                            const rinse = typeof fullIngredient.maxUsageRinseOff === 'number' ? fullIngredient.maxUsageRinseOff : null;
                            const legacy = typeof fullIngredient.maxUsage === 'number' ? fullIngredient.maxUsage : null;
                            
                            if (leave !== null && rinse !== null) {
                              return `Leave-On ${leave}% • Rinse-Off ${rinse}%`;
                            }
                            if (productType === 'leaveOn' && leave !== null) {
                              return `Leave-On: ${leave}%`;
                            }
                            if (productType === 'rinseOff' && rinse !== null) {
                              return `Rinse-Off: ${rinse}%`;
                            }
                            if (legacy !== null) {
                              return `${legacy}% (fallback)`;
                            }
                            return '—';
                          };

                          return (
                            <tr key={ing.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-900">{ing.name}</td>
                              <td className="px-4 py-2 text-gray-600 text-xs">{fullIngredient?.inci || '—'}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-900">{ing.percentage.toFixed(2)}%</td>
                              <td className="px-4 py-2 text-gray-600">{fullIngredient?.category || '—'}</td>
                              <td className="px-4 py-2 text-gray-600 text-xs">{getMaxUsageDisplay()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Manufacturing Procedure Section */}
                {processSteps.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Manufacturing Procedure</h3>
                    <div className="space-y-3">
                      {processSteps
                        .sort((a, b) => a.order - b.order)
                        .map((step) => {
                          const metaParts: string[] = [];
                          if (step.phase) metaParts.push(`Phase ${step.phase}`);
                          if (step.tempC !== null && step.tempC !== undefined) {
                            metaParts.push(`${step.tempC}°C`);
                          }
                          if (step.timeMin !== null && step.timeMin !== undefined) {
                            metaParts.push(`${step.timeMin} min`);
                          }
                          const metaLine = metaParts.length > 0 ? metaParts.join(", ") : null;

                          return (
                            <div key={step.id} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                              <div className="text-sm text-gray-900">
                                <span className="font-semibold">{step.order}. {step.title}</span>
                                {metaLine && (
                                  <span className="text-gray-600 ml-2">({metaLine})</span>
                                )}
                              </div>
                              {step.description && (
                                <div className="text-xs text-gray-700 mt-2">{step.description}</div>
                              )}
                              {step.notes && (
                                <div className="text-xs text-gray-500 italic mt-1">{step.notes}</div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Warnings Summary */}
                <div className="space-y-6">
                  {/* Max Usage Group Warnings */}
                  {groupMaxUsageWarnings.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold text-amber-900 mb-3">Max Usage (Group) Warnings</h3>
                      <div className="space-y-2">
                        {groupMaxUsageWarnings.map((warning, idx) => (
                          <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="text-sm text-amber-900">
                              <span className="font-semibold">{warning.category}:</span> Total {warning.totalPercent.toFixed(2)}% (recommended max: {warning.limitPercent.toFixed(2)}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EU Compliance */}
                  {euComplianceBlocks.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold text-red-900 mb-3">EU Compliance</h3>
                      <div className="space-y-3">
                        {/* Prohibited (Annex II) */}
                        {euComplianceBlocks.filter(b => b.annex === 'II').length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-800 mb-2">Prohibited (Annex II)</h4>
                            <div className="space-y-2">
                              {euComplianceBlocks.filter(b => b.annex === 'II').map((block) => (
                                <div key={block.id} className="p-3 bg-red-50 border border-red-200 rounded-md">
                                  <div className="text-sm text-red-900">
                                    <span className="font-semibold">{block.ingredientName}</span> ({block.inci_canonical})
                                  </div>
                                  <div className="text-xs text-red-800 mt-1">{block.reason}</div>
                                  {block.conditions_text && (
                                    <div className="text-xs text-red-700 mt-1 italic">Conditions: {block.conditions_text}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Restrictions (Annex III/VI) */}
                        {euComplianceBlocks.filter(b => b.annex !== 'II').length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-orange-800 mb-2">Restrictions (Annex III/VI)</h4>
                            <div className="space-y-2">
                              {euComplianceBlocks.filter(b => b.annex !== 'II').map((block) => (
                                <div key={block.id} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                                  <div className="text-sm text-orange-900">
                                    <span className="font-semibold">{block.ingredientName}</span> ({block.inci_canonical})
                                  </div>
                                  <div className="text-xs text-orange-800 mt-1">{block.reason}</div>
                                  {block.max_percentage !== null && (
                                    <div className="text-xs text-orange-700 mt-1">
                                      Max: {block.max_percentage}% • Actual: {block.actual_percentage.toFixed(2)}%
                                    </div>
                                  )}
                                  {block.conditions_text && (
                                    <div className="text-xs text-orange-700 mt-1 italic">Conditions: {block.conditions_text}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* IFRA Informational */}
                  {ifraWarnings.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold text-blue-900 mb-3">IFRA Guidance (Informational)</h3>
                      <div className="space-y-2">
                        {ifraWarnings.map((warning, idx) => (
                          <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="text-sm text-blue-900">
                              <span className="font-semibold">{warning.ingredientName}</span> ({warning.inci})
                            </div>
                            <div className="text-xs text-blue-800 mt-1">
                              {warning.entries.length} IFRA standard{warning.entries.length > 1 ? 's' : ''} associated
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                {/* Helper function to generate plain text summary */}
                {(() => {
                  const generateTextSummary = () => {
                    const allAvailableIngredients = [...allIngredients, ...customIngredients].map(enrichIngredientWithKb);
                    
                    let text = `COMPLIANCE SUMMARY\n`;
                    text += `==================\n\n`;
                    text += `Formula: ${formulaName}\n`;
                    text += `Product Type: ${productType === 'leaveOn' ? 'Leave-On' : 'Rinse-Off'}\n`;
                    if (batchSize > 0) {
                      text += `Batch Size: ${batchSize}g\n`;
                    }
                    text += `\n`;
                    
                    text += `INGREDIENTS\n`;
                    text += `-----------\n`;
                    ingredients.forEach((ing) => {
                      const fullIngredient = ing.ingredientId
                        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
                        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
                      
                      const leave = fullIngredient && typeof fullIngredient.maxUsageLeaveOn === 'number' ? fullIngredient.maxUsageLeaveOn : null;
                      const rinse = fullIngredient && typeof fullIngredient.maxUsageRinseOff === 'number' ? fullIngredient.maxUsageRinseOff : null;
                      const legacy = fullIngredient && typeof fullIngredient.maxUsage === 'number' ? fullIngredient.maxUsage : null;
                      
                      let maxUsageText = '—';
                      if (leave !== null && rinse !== null) {
                        maxUsageText = `Leave-On ${leave}% • Rinse-Off ${rinse}%`;
                      } else if (productType === 'leaveOn' && leave !== null) {
                        maxUsageText = `Leave-On: ${leave}%`;
                      } else if (productType === 'rinseOff' && rinse !== null) {
                        maxUsageText = `Rinse-Off: ${rinse}%`;
                      } else if (legacy !== null) {
                        maxUsageText = `${legacy}% (fallback)`;
                      }
                      
                      text += `${ing.name} | ${fullIngredient?.inci || '—'} | ${ing.percentage.toFixed(2)}% | ${fullIngredient?.category || '—'} | Max: ${maxUsageText}\n`;
                    });
                    text += `\n`;
                    
                    if (processSteps.length > 0) {
                      text += `MANUFACTURING PROCEDURE\n`;
                      text += `----------------------\n`;
                      processSteps
                        .sort((a, b) => a.order - b.order)
                        .forEach((step) => {
                          const metaParts: string[] = [];
                          if (step.phase) metaParts.push(`Phase ${step.phase}`);
                          if (step.tempC !== null && step.tempC !== undefined) {
                            metaParts.push(`${step.tempC}°C`);
                          }
                          if (step.timeMin !== null && step.timeMin !== undefined) {
                            metaParts.push(`${step.timeMin} min`);
                          }
                          const metaLine = metaParts.length > 0 ? ` (${metaParts.join(", ")})` : '';
                          
                          text += `${step.order}. ${step.title}${metaLine}\n`;
                          if (step.description) {
                            text += `   ${step.description}\n`;
                          }
                          if (step.notes) {
                            text += `   Notes: ${step.notes}\n`;
                          }
                        });
                      text += `\n`;
                    }
                    
                    if (groupMaxUsageWarnings.length > 0) {
                      text += `MAX USAGE (GROUP) WARNINGS\n`;
                      text += `-------------------------\n`;
                      groupMaxUsageWarnings.forEach((warning) => {
                        text += `${warning.category}: Total ${warning.totalPercent.toFixed(2)}% (recommended max: ${warning.limitPercent.toFixed(2)}%)\n`;
                      });
                      text += `\n`;
                    }
                    
                    if (euComplianceBlocks.length > 0) {
                      text += `EU COMPLIANCE\n`;
                      text += `-------------\n`;
                      const prohibited = euComplianceBlocks.filter(b => b.annex === 'II');
                      const restrictions = euComplianceBlocks.filter(b => b.annex !== 'II');
                      
                      if (prohibited.length > 0) {
                        text += `Prohibited (Annex II):\n`;
                        prohibited.forEach((block) => {
                          text += `  - ${block.ingredientName} (${block.inci_canonical}): ${block.reason}\n`;
                          if (block.conditions_text) {
                            text += `    Conditions: ${block.conditions_text}\n`;
                          }
                        });
                        text += `\n`;
                      }
                      
                      if (restrictions.length > 0) {
                        text += `Restrictions (Annex III/VI):\n`;
                        restrictions.forEach((block) => {
                          text += `  - ${block.ingredientName} (${block.inci_canonical}): ${block.reason}\n`;
                          if (block.max_percentage !== null) {
                            text += `    Max: ${block.max_percentage}% • Actual: ${block.actual_percentage.toFixed(2)}%\n`;
                          }
                          if (block.conditions_text) {
                            text += `    Conditions: ${block.conditions_text}\n`;
                          }
                        });
                        text += `\n`;
                      }
                    }
                    
                    if (ifraWarnings.length > 0) {
                      text += `IFRA GUIDANCE (INFORMATIONAL)\n`;
                      text += `-----------------------------\n`;
                      ifraWarnings.forEach((warning) => {
                        text += `${warning.ingredientName} (${warning.inci}): ${warning.entries.length} IFRA standard${warning.entries.length > 1 ? 's' : ''} associated\n`;
                      });
                    }
                    
                    return text;
                  };

                  const generateJsonSummary = () => {
                    const allAvailableIngredients = [...allIngredients, ...customIngredients].map(enrichIngredientWithKb);
                    const now = new Date();
                    
                    const ingredientsData = ingredients.map((ing) => {
                      const fullIngredient = ing.ingredientId
                        ? allAvailableIngredients.find(ai => ai.id === ing.ingredientId)
                        : allAvailableIngredients.find(ai => ai.name.toLowerCase() === ing.name.toLowerCase());
                      
                      return {
                        name: ing.name,
                        inci: fullIngredient?.inci || null,
                        percent: ing.percentage,
                        category: fullIngredient?.category || null,
                        maxUsageLeaveOn: fullIngredient && typeof fullIngredient.maxUsageLeaveOn === 'number' ? fullIngredient.maxUsageLeaveOn : null,
                        maxUsageRinseOff: fullIngredient && typeof fullIngredient.maxUsageRinseOff === 'number' ? fullIngredient.maxUsageRinseOff : null,
                        maxUsageFallback: fullIngredient && typeof fullIngredient.maxUsage === 'number' ? fullIngredient.maxUsage : null,
                      };
                    });

                    const prohibited = euComplianceBlocks.filter(b => b.annex === 'II');
                    const restrictions = euComplianceBlocks.filter(b => b.annex !== 'II');

                    return {
                      meta: {
                        formulaName: formulaName,
                        productType: productType === 'leaveOn' ? 'leave-on' : 'rinse-off',
                        batchSize: batchSize > 0 ? batchSize : null,
                        generatedAtISO: now.toISOString(),
                      },
                      ingredients: ingredientsData,
                      processSteps: processSteps.length > 0 ? processSteps
                        .sort((a, b) => a.order - b.order)
                        .map((step) => ({
                          order: step.order,
                          title: step.title,
                          phase: step.phase || null,
                          tempC: step.tempC ?? null,
                          timeMin: step.timeMin ?? null,
                          description: step.description || null,
                          notes: step.notes || null,
                        })) : [],
                      warnings: {
                        maxUsageGroup: groupMaxUsageWarnings.length > 0 ? groupMaxUsageWarnings.map(w => ({
                          category: w.category,
                          totalPercent: w.totalPercent,
                          limitPercent: w.limitPercent,
                        })) : [],
                        eu: {
                          prohibited: prohibited.length > 0 ? prohibited.map(b => ({
                            ingredientName: b.ingredientName,
                            inci: b.inci_canonical,
                            annex: b.annex,
                            reason: b.reason,
                            conditionsText: b.conditions_text,
                            referenceUrl: b.reference_url,
                            source: b.source,
                          })) : [],
                          restrictions: restrictions.length > 0 ? restrictions.map(b => ({
                            ingredientName: b.ingredientName,
                            inci: b.inci_canonical,
                            annex: b.annex,
                            reason: b.reason,
                            maxPercentage: b.max_percentage,
                            actualPercentage: b.actual_percentage,
                            conditionsText: b.conditions_text,
                            referenceUrl: b.reference_url,
                            source: b.source,
                          })) : [],
                        },
                        ifra: {
                          warnings: ifraWarnings.length > 0 ? ifraWarnings.map(w => ({
                            ingredientName: w.ingredientName,
                            inci: w.inci,
                            entries: w.entries.map(e => ({
                              standardName: e.standard_name,
                              standardType: e.ifra_standard_type,
                              amendmentNumber: e.amendment_number,
                              referenceUrl: e.reference_url,
                            })),
                          })) : [],
                        },
                      },
                    };
                  };

                  const downloadFile = (content: string, filename: string, mimeType: string) => {
                    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  };

                  const getFilename = (extension: string) => {
                    const safeName = formulaName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'untitled';
                    const date = new Date().toISOString().split('T')[0];
                    return `formula-summary-${safeName}-${date}.${extension}`;
                  };

                  return (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const text = generateTextSummary();
                            await navigator.clipboard.writeText(text);
                            alert('Summary copied to clipboard!');
                          } catch (error) {
                            console.error('Failed to copy to clipboard:', error);
                            alert('Failed to copy to clipboard. Please try again.');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
                      >
                        <FilePlus className="w-4 h-4" />
                        Copy to Clipboard
                      </button>
                      <button
                        onClick={() => {
                          const text = generateTextSummary();
                          downloadFile(text, getFilename('txt'), 'text/plain');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download TXT
                      </button>
                      <button
                        onClick={() => {
                          const jsonData = generateJsonSummary();
                          const jsonString = JSON.stringify(jsonData, null, 2);
                          downloadFile(jsonString, getFilename('json'), 'application/json');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download JSON
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const jsonData = generateJsonSummary();
                            const jsonString = JSON.stringify(jsonData);
                            // Use base64url encoding (URL-safe base64)
                            const encoded = btoa(jsonString)
                              .replace(/\+/g, '-')
                              .replace(/\//g, '_')
                              .replace(/=+$/, '');
                            const shareUrl = `${window.location.origin}/share?data=${encoded}`;
                            
                            // URL size guard: check if URL exceeds safe limit (2000 chars)
                            if (shareUrl.length > 2000) {
                              alert('This formula is too large to share as a link. Please use Download JSON or TXT.');
                              return;
                            }
                            
                            await navigator.clipboard.writeText(shareUrl);
                            alert('Share link copied to clipboard!');
                          } catch (error) {
                            console.error('Failed to generate share link:', error);
                            alert('Failed to generate share link. Please try again.');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                      >
                        <Share2 className="w-4 h-4" />
                        Share link
                      </button>
                      <button
                        onClick={() => setShowExportSummaryModal(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                      >
                        Close
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
            onClick={() => {
              setShowTemplateSelector(false);
              setTemplateSearchQuery("");
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Select Process Template</h3>
                <button
                  onClick={() => {
                    setShowTemplateSelector(false);
                    setTemplateSearchQuery("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose a template to initialize your process steps. You can edit them after applying.
                </p>
                <div className="mb-4">
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="Search templates…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="space-y-3">
                  {(() => {
                    const filteredTemplates = processTemplates.filter((template) => {
                      if (!templateSearchQuery.trim()) return true;
                      const query = templateSearchQuery.toLowerCase().trim();
                      const nameMatch = template.name.toLowerCase().includes(query);
                      const tagMatch = template.tags.some((tag) => tag.toLowerCase().includes(query));
                      return nameMatch || tagMatch;
                    });

                    if (filteredTemplates.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No templates found</p>
                          <p className="text-xs mt-1">Try a different search term</p>
                        </div>
                      );
                    }

                    return filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full text-left p-4 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-semibold text-gray-900 mb-1">{template.name}</div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-xs text-gray-600">
                            {template.steps.length} step{template.steps.length > 1 ? 's' : ''}
                          </div>
                          {template.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {template.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowTemplateSelector(false);
                    setTemplateSearchQuery("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowHelpModal(false);
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">How this works</h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-3 text-sm text-gray-700">
                  <ul className="space-y-3 list-none">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span><strong className="text-gray-900">Product Type:</strong> Leave-On vs Rinse-Off affects some max usage limits.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span><strong className="text-gray-900">Max Usage (Group) warnings:</strong> Sum percentages by category and compare to the strictest limit in that category.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>If an ingredient has Leave-On/Rinse-Off limits, those are used; otherwise Max Usage (%) is used as fallback.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span><strong className="text-gray-900">Custom ingredients:</strong> You can enter one Max Usage (%) or use Advanced limits (optional).</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span><strong className="text-gray-900">EU compliance checks</strong> reference Annex II/III/VI and are informational; verify against official regulation + supplier docs.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span><strong className="text-gray-900">IFRA guidance</strong> is informational; IFRA warnings show only for ingredients marked as Fragrance.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>Use Compliance Summary export to share or archive results.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Process Step Modal */}
        {showProcessStepModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
            onClick={() => {
              setShowProcessStepModal(false);
              setEditingStepId(null);
              setNewProcessStep({
                title: "",
                phase: undefined,
                tempC: null,
                timeMin: null,
                description: "",
                notes: "",
              });
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingStepId ? "Edit Process Step" : "Add Process Step"}
                </h3>
                <button
                  onClick={() => {
                    setShowProcessStepModal(false);
                    setEditingStepId(null);
                    setNewProcessStep({
                      title: "",
                      phase: undefined,
                      tempC: null,
                      timeMin: null,
                      description: "",
                      notes: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label htmlFor="stepTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    id="stepTitle"
                    type="text"
                    value={newProcessStep.title || ""}
                    onChange={(e) =>
                      setNewProcessStep({ ...newProcessStep, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    placeholder="e.g., Heat Phase A"
                  />
                </div>

                <div>
                  <label htmlFor="stepPhase" className="block text-sm font-medium text-gray-700 mb-2">
                    Phase
                  </label>
                  <select
                    id="stepPhase"
                    value={newProcessStep.phase || ""}
                    onChange={(e) =>
                      setNewProcessStep({
                        ...newProcessStep,
                        phase: e.target.value as ProcessPhase | undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select phase...</option>
                    <option value="general">General</option>
                    <option value="A">Phase A</option>
                    <option value="B">Phase B</option>
                    <option value="C">Phase C</option>
                    <option value="coolDown">Cool Down</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="stepTempC" className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature (°C)
                    </label>
                    <input
                      id="stepTempC"
                      type="number"
                      value={newProcessStep.tempC ?? ""}
                      onChange={(e) =>
                        setNewProcessStep({
                          ...newProcessStep,
                          tempC: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="e.g., 70"
                    />
                  </div>

                  <div>
                    <label htmlFor="stepTimeMin" className="block text-sm font-medium text-gray-700 mb-2">
                      Time (minutes)
                    </label>
                    <input
                      id="stepTimeMin"
                      type="number"
                      value={newProcessStep.timeMin ?? ""}
                      onChange={(e) =>
                        setNewProcessStep({
                          ...newProcessStep,
                          timeMin: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="e.g., 15"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="stepDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="stepDescription"
                    value={newProcessStep.description || ""}
                    onChange={(e) =>
                      setNewProcessStep({ ...newProcessStep, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-y"
                    placeholder="Step description..."
                  />
                </div>

                <div>
                  <label htmlFor="stepNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="stepNotes"
                    value={newProcessStep.notes || ""}
                    onChange={(e) =>
                      setNewProcessStep({ ...newProcessStep, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-y"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowProcessStepModal(false);
                    setEditingStepId(null);
                    setNewProcessStep({
                      title: "",
                      phase: undefined,
                      tempC: null,
                      timeMin: null,
                      description: "",
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProcessStep}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
                >
                  {editingStepId ? "Update" : "Add"} Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

