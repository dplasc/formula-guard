export interface DemoIngredient {
  id: string;
  name: string;
  inci: string;
  category: 'Oils' | 'Emulsifiers' | 'Actives' | 'Fragrance';
  demoLimitLeaveOn: number; // percentage
  demoLimitRinseOff: number; // percentage
}

export const demoIngredients: DemoIngredient[] = [
  // Oils
  {
    id: 'demo-sweet-almond-oil',
    name: 'Sweet Almond Oil',
    inci: 'Prunus Amygdalus Dulcis (Sweet Almond) Oil',
    category: 'Oils',
    demoLimitLeaveOn: 80,
    demoLimitRinseOff: 100,
  },
  {
    id: 'demo-jojoba-oil',
    name: 'Jojoba Oil',
    inci: 'Simmondsia Chinensis (Jojoba) Seed Oil',
    category: 'Oils',
    demoLimitLeaveOn: 100,
    demoLimitRinseOff: 100,
  },
  {
    id: 'demo-argan-oil',
    name: 'Argan Oil',
    inci: 'Argania Spinosa Kernel Oil',
    category: 'Oils',
    demoLimitLeaveOn: 50,
    demoLimitRinseOff: 100,
  },
  {
    id: 'demo-rosehip-oil',
    name: 'Rosehip Oil',
    inci: 'Rosa Canina Fruit Oil',
    category: 'Oils',
    demoLimitLeaveOn: 20,
    demoLimitRinseOff: 50,
  },
  {
    id: 'demo-coconut-oil',
    name: 'Coconut Oil',
    inci: 'Cocos Nucifera (Coconut) Oil',
    category: 'Oils',
    demoLimitLeaveOn: 100,
    demoLimitRinseOff: 100,
  },

  // Emulsifiers
  {
    id: 'demo-olive-emulsifier',
    name: 'Olive Emulsifier',
    inci: 'PEG-20 Glyceryl Triisostearate',
    category: 'Emulsifiers',
    demoLimitLeaveOn: 15,
    demoLimitRinseOff: 15,
  },
  {
    id: 'demo-lecithin',
    name: 'Soy Lecithin',
    inci: 'Lecithin',
    category: 'Emulsifiers',
    demoLimitLeaveOn: 10,
    demoLimitRinseOff: 10,
  },
  {
    id: 'demo-beeswax',
    name: 'Beeswax',
    inci: 'Cera Alba',
    category: 'Emulsifiers',
    demoLimitLeaveOn: 20,
    demoLimitRinseOff: 20,
  },
  {
    id: 'demo-xanthan-gum',
    name: 'Xanthan Gum',
    inci: 'Xanthan Gum',
    category: 'Emulsifiers',
    demoLimitLeaveOn: 2,
    demoLimitRinseOff: 2,
  },

  // Actives
  {
    id: 'demo-vitamin-e',
    name: 'Vitamin E (Tocopherol)',
    inci: 'Tocopherol',
    category: 'Actives',
    demoLimitLeaveOn: 5,
    demoLimitRinseOff: 5,
  },
  {
    id: 'demo-niacinamide',
    name: 'Niacinamide',
    inci: 'Niacinamide',
    category: 'Actives',
    demoLimitLeaveOn: 10,
    demoLimitRinseOff: 10,
  },
  {
    id: 'demo-hyaluronic-acid',
    name: 'Hyaluronic Acid',
    inci: 'Hyaluronic Acid',
    category: 'Actives',
    demoLimitLeaveOn: 2,
    demoLimitRinseOff: 2,
  },
  {
    id: 'demo-retinol',
    name: 'Retinol',
    inci: 'Retinol',
    category: 'Actives',
    demoLimitLeaveOn: 1,
    demoLimitRinseOff: 1,
  },
  {
    id: 'demo-green-tea-extract',
    name: 'Green Tea Extract',
    inci: 'Camellia Sinensis Leaf Extract',
    category: 'Actives',
    demoLimitLeaveOn: 5,
    demoLimitRinseOff: 5,
  },

  // Fragrance
  {
    id: 'demo-lavender-essential',
    name: 'Lavender Essential Oil',
    inci: 'Lavandula Angustifolia (Lavender) Oil',
    category: 'Fragrance',
    demoLimitLeaveOn: 2,
    demoLimitRinseOff: 5,
  },
  {
    id: 'demo-rose-essential',
    name: 'Rose Essential Oil',
    inci: 'Rosa Damascena Flower Oil',
    category: 'Fragrance',
    demoLimitLeaveOn: 1,
    demoLimitRinseOff: 3,
  },
  {
    id: 'demo-eucalyptus-essential',
    name: 'Eucalyptus Essential Oil',
    inci: 'Eucalyptus Globulus Leaf Oil',
    category: 'Fragrance',
    demoLimitLeaveOn: 1.5,
    demoLimitRinseOff: 4,
  },
  {
    id: 'demo-fragrance-blend',
    name: 'Fragrance Blend (Natural)',
    inci: 'Parfum (Natural)',
    category: 'Fragrance',
    demoLimitLeaveOn: 2,
    demoLimitRinseOff: 5,
  },
];


