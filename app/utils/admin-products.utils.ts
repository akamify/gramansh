export type CategoryNode = {
  _id: string;
  id?: string;
  name: string;
  parent?: string | null;
  ancestors?: Array<{ _id: string; name: string }>;
  children?: CategoryNode[];
};

export type ProductItem = {
  _id?: string;
  product_id: number;
  product_code?: string;
  name: string;
  title?: string;
  sku?: string;
  price?: number;
  selling_price?: number;
  description?: string;
  quantity?: number;
  status?: string;
  catagory_id?: { _id?: string; name?: string } | string;
  product_image?: string[];
  video_url?: string;
  colors?: string[];
  sizes?: string[];
  variants?: Array<{
    label: string;
    stock: number;
    price: number;
    originalPrice?: number;
    selling_price?: number;
    image?: string;
  }>;
  ingredients?: Array<{ key: string; value: string }>;
  nutritions?: Array<{ key: string; value: string }>;
  key_highlights?: Array<{ key: string; value: string }>;
  specifications?: Array<{ key: string; value: string }>;
};

export type IngredientRow = { key: string; value: string };
export type NutritionRow = { key: string; value: string };
export type WeightUnit = 'GM' | 'KG';

export type VariantRow = {
  weight: string;
  weightUnit: WeightUnit;
  price: string;
  discountedPrice: string;
  stock: number;
  image: File | null;
  existingImage: string;
};

export const WEIGHT_UNIT_OPTIONS: WeightUnit[] = ['GM', 'KG'];
export const DESCRIPTION_MAX_LENGTH = 1200;
export const INGREDIENTS_COUNT = 3;
export const NUTRITIONS_COUNT = 5;

export const createEmptyVariant = (): VariantRow => ({
  weight: '',
  weightUnit: 'GM',
  price: '',
  discountedPrice: '',
  stock: 0,
  image: null,
  existingImage: '',
});

export const createEmptyIngredient = (): IngredientRow => ({ key: '', value: '' });
export const createEmptyNutrition = (): NutritionRow => ({ key: '', value: '' });

export const categoryIdOf = (node: CategoryNode) => String(node._id || node.id || '');

export const parseCategoryId = (value: ProductItem['catagory_id']) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || '';
};

export const formatCurrency = (value?: number) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

export const normalizeSkuInput = (value: string) => {
  const clean = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const letters = clean.replace(/[^A-Z]/g, '').slice(0, 2);
  const digits = clean.replace(/[^0-9]/g, '').slice(0, 3);
  if (!letters) return '';
  if (letters.length < 2) return letters;
  return digits ? `${letters}-${digits}` : `${letters}-`;
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const toEditorHtml = (value: string) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return escapeHtml(raw).replace(/\n/g, '<br/>');
};

export const stripHtmlToPlainText = (html: string) => {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const node = document.createElement('div');
  node.innerHTML = html;
  return (node.textContent || '').replace(/\s+/g, ' ').trim();
};

export const insertPlainTextAtCaret = (text: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    document.execCommand('insertText', false, text);
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
};

export function normalizeCategoryNodes(raw: unknown[]): CategoryNode[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const r = item as Record<string, unknown>;
    const childRows = Array.isArray(r.children) ? r.children : [];
    const ancestorsRaw = Array.isArray(r.ancestors) ? r.ancestors : [];
    return {
      _id: String(r._id ?? r.id ?? ''),
      id: r.id != null ? String(r.id) : undefined,
      name: String(r.name ?? ''),
      parent: r.parent != null && r.parent !== '' ? String(r.parent) : null,
      ancestors: ancestorsRaw.map((a) => {
        const ar = a as Record<string, unknown>;
        return { _id: String(ar._id ?? ''), name: String(ar.name ?? '') };
      }),
      children: normalizeCategoryNodes(childRows as unknown[]),
    };
  });
}
