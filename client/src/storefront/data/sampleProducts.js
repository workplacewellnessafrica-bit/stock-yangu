// src/storefront/data/sampleProducts.js
// Fallback data shown when the API is unreachable (template preview mode).

export const SAMPLE_PRODUCTS = [
  {
    id: 'sp-001', name: 'Fresh Tomatoes', emoji: '🍅', description: 'Farm-fresh, ripe tomatoes. Perfect for cooking or salads.',
    category: 'Vegetables', price: 85, unit: 'kg', stock: 30, threshold: 5,
    images: [], tags: ['fresh', 'organic'], sku: 'TOM-001', active: true, featured: true, variants: [
      { id: 'v1', name: '½ kg', price: 45, qty: 0.5 },
      { id: 'v2', name: '1 kg', price: 85, qty: 1 },
      { id: 'v3', name: '3 kg', price: 240, qty: 3 },
    ],
  },
  {
    id: 'sp-002', name: 'WholeMeal Bread', emoji: '🍞', description: 'Freshly baked wholemeal loaf. High fibre, great taste.',
    category: 'Bakery', price: 60, unit: 'loaf', stock: 12, threshold: 3,
    images: [], tags: ['whole-grain', 'healthy'], sku: 'BRD-001', active: true, featured: false, variants: [],
  },
  {
    id: 'sp-003', name: 'Fresh Milk', emoji: '🥛', description: 'Fresh pasteurized whole milk, delivered daily.',
    category: 'Dairy', price: 55, unit: '500ml', stock: 40, threshold: 8,
    images: [], tags: ['dairy', 'fresh'], sku: 'MLK-001', active: true, featured: true, variants: [
      { id: 'v1', name: '500ml', price: 55, qty: 0.5 },
      { id: 'v2', name: '1L', price: 100, qty: 1 },
    ],
  },
  {
    id: 'sp-004', name: 'Cooking Oil', emoji: '🫙', description: 'Pure sunflower cooking oil. For healthy everyday cooking.',
    category: 'Essentials', price: 180, unit: 'bottle', stock: 20, threshold: 5,
    images: [], tags: [], sku: 'OIL-001', active: true, featured: false, variants: [
      { id: 'v1', name: '500ml', price: 95, qty: 0.5 },
      { id: 'v2', name: '1L', price: 180, qty: 1 },
    ],
  },
  {
    id: 'sp-005', name: 'Sukari (Sugar)', emoji: '🍬', description: 'Fine white cane sugar for baking, cooking, and beverages.',
    category: 'Essentials', price: 120, unit: 'kg', stock: 3, threshold: 5,
    images: [], tags: ['staple'], sku: 'SGR-001', active: true, featured: false, variants: [
      { id: 'v1', name: '1 kg', price: 120, qty: 1 },
      { id: 'v2', name: '2 kg', price: 230, qty: 2 },
    ],
  },
  {
    id: 'sp-006', name: 'Spinach (Sukuma)', emoji: '🥬', description: 'Tender sukuma wiki leaves, freshly harvested. High in iron.',
    category: 'Vegetables', price: 30, unit: 'bunch', stock: 0, threshold: 5,
    images: [], tags: ['green', 'fresh', 'kenyan'], sku: 'SKM-001', active: true, featured: false, variants: [],
  },
  {
    id: 'sp-007', name: 'Eggs (Tray)', emoji: '🥚', description: 'Free-range eggs. 30 per tray, locally sourced.',
    category: 'Dairy', price: 450, unit: 'tray', stock: 15, threshold: 3,
    images: [], tags: ['protein', 'breakfast'], sku: 'EGG-001', active: true, featured: true, variants: [
      { id: 'v1', name: '6 pack', price: 100, qty: 6 },
      { id: 'v2', name: '12 pack', price: 190, qty: 12 },
      { id: 'v3', name: '30 tray', price: 450, qty: 30 },
    ],
  },
  {
    id: 'sp-008', name: 'Rice (Mwea Pishori)', emoji: '🍚', description: 'Premium Mwea Pishori long-grain aromatic rice.',
    category: 'Grains', price: 160, unit: 'kg', stock: 50, threshold: 10,
    images: [], tags: ['kenyan', 'premium', 'staple'], sku: 'RIC-001', active: true, featured: true, variants: [
      { id: 'v1', name: '1 kg', price: 160, qty: 1 },
      { id: 'v2', name: '2 kg', price: 300, qty: 2 },
      { id: 'v3', name: '5 kg', price: 720, qty: 5 },
    ],
  },
];

export const SAMPLE_CATEGORIES = [
  { id: 'Vegetables', name: 'Vegetables', icon: '🥦', subcategories: [] },
  { id: 'Dairy',      name: 'Dairy & Eggs', icon: '🥛', subcategories: [] },
  { id: 'Bakery',     name: 'Bakery', icon: '🍞', subcategories: [] },
  { id: 'Essentials', name: 'Essentials', icon: '🫙', subcategories: [] },
  { id: 'Grains',     name: 'Grains', icon: '🌾', subcategories: [] },
];
