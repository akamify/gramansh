'use client';

import React, {
  useEffect,
  useRef,
  useState,
  type ClipboardEventHandler,
  type FormEventHandler,
  type MouseEventHandler,
} from 'react';
import ResilientProductImage from '@/app/components/ResilientProductImage';
import { useSiteSettings } from '@/app/context/SiteSettingsContext';
import {
  createAdminCategory,
  createAdminProduct,
  updateAdminCategory,
  updateAdminProduct,
} from '@/app/lib/apiClient';

import {
  CategoryNode,
  ProductItem,
  HighlightRow,
  IngredientRow,
  NutritionRow,
  SpecificationRow,
  WeightUnit,
  VariantRow,
  WEIGHT_UNIT_OPTIONS,
  DESCRIPTION_MAX_LENGTH,
  HIGHLIGHTS_COUNT,
  INGREDIENTS_COUNT,
  NUTRITIONS_COUNT,
  SPECIFICATIONS_COUNT,
  createEmptyVariant,
  createEmptyHighlight,
  createEmptyIngredient,
  createEmptyNutrition,
  createEmptySpecification,
  normalizeSkuInput,
  parseCategoryId,
  toEditorHtml,
  stripHtmlToPlainText,
  insertPlainTextAtCaret,
} from '../utils/admin-products.utils';

type Props = {
  open: boolean;
  product: ProductItem | null;
  categories: CategoryNode[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
};

type StepProps = {
  active: boolean;
  done: boolean;
  label: string;
};

type ToolbarAction = {
  label: string;
  onClick: () => void;
};

function StepBadge({ active, done, label }: StepProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm transition ${active
        ? 'border-slate-900 bg-slate-900 text-white'
        : done
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
    >
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function LocalImagePreview({ file }: { file: File }) {
  const [source, setSource] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSource(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
      <ResilientProductImage
        sources={[source]}
        alt={`New variant ${file.name}`}
        className="h-full w-full object-cover"
        fallbackClassName="bg-slate-100 text-slate-400"
        compact
      />
    </div>
  );
}

function fileSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

const findCategoryNameById = (nodes: CategoryNode[], id: string): string | null => {
  for (const node of nodes) {
    if (String(node._id) === id || String(node.id || '') === id) return node.name;
    if (Array.isArray(node.children) && node.children.length) {
      const found = findCategoryNameById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export default function ProductEditor({
  open,
  product,
  categories,
  onClose,
  onSaved,
  onError,
}: Props) {
  const { settings } = useSiteSettings();
  const currency = settings.currencySymbol || '₹';

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState<HighlightRow[]>(
    Array.from({ length: HIGHLIGHTS_COUNT }, () => createEmptyHighlight())
  );
  const [variants, setVariants] = useState<VariantRow[]>([createEmptyVariant()]);
  const [codAvailable, setCodAvailable] = useState(false);
  const [sku, setSku] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    Array.from({ length: INGREDIENTS_COUNT }, () => createEmptyIngredient())
  );
  const [nutritions, setNutritions] = useState<NutritionRow[]>(
    Array.from({ length: NUTRITIONS_COUNT }, () => createEmptyNutrition())
  );
  const [specifications, setSpecifications] = useState<SpecificationRow[]>(
    Array.from({ length: SPECIFICATIONS_COUNT }, () => createEmptySpecification())
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [descriptionTextLength, setDescriptionTextLength] = useState(0);
  const [renameCategoryName, setRenameCategoryName] = useState('');
  const [renameCategoryBusy, setRenameCategoryBusy] = useState(false);
  const [renameCategoryStatus, setRenameCategoryStatus] = useState('');
  const [hasHydratedDescription, setHasHydratedDescription] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastValidDescriptionHtmlRef = useRef('');
  const savedSelectionRef = useRef<Range | null>(null);

  const editingProductId = product?.product_id ?? null;
  const totalStock = variants.reduce((acc, v) => acc + Number(v.stock || 0), 0);

  const resetEditor = () => {
    setStep(1);
    setNewCategoryName('');
    setName('');
    setDescription('');
    setHasHydratedDescription(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setHighlights(Array.from({ length: HIGHLIGHTS_COUNT }, () => createEmptyHighlight()));
    setVariants([createEmptyVariant()]);
    setCodAvailable(false);
    setSku('');
    setIngredients(Array.from({ length: INGREDIENTS_COUNT }, () => createEmptyIngredient()));
    setNutritions(Array.from({ length: NUTRITIONS_COUNT }, () => createEmptyNutrition()));
    setSpecifications(Array.from({ length: SPECIFICATIONS_COUNT }, () => createEmptySpecification()));
    setSelectedCategoryId('');
    setRenameCategoryName('');
    setRenameCategoryBusy(false);
    setRenameCategoryStatus('');
    setDescriptionTextLength(0);
    lastValidDescriptionHtmlRef.current = '';
  };

  useEffect(() => {
    if (!open) return;

    if (product) {
      setStep(1);
      const descriptionHtml = toEditorHtml(product.description || '');
      setName(product.name || product.title || '');
      setDescription(descriptionHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = descriptionHtml;
      }
      setSku(product.sku || '');
      setCodAvailable(product.cod_available === true || product.cod_available === 'true' || product.codAvailable === true || product.codAvailable === 'true');
      const highlightRows =
        Array.isArray(product.key_highlights) && product.key_highlights.length
          ? product.key_highlights.map((s: Record<string, unknown>) => ({
            key: String(s.key || ''),
            value: String(s.value || ''),
          }))
          : Array.from({ length: HIGHLIGHTS_COUNT }, () => createEmptyHighlight());
      setHighlights(highlightRows);
      setSelectedCategoryId(parseCategoryId(product.catagory_id));

      const ingredientRows =
        Array.isArray(product.ingredients) && product.ingredients.length
          ? product.ingredients.map((s: Record<string, unknown>) => ({
            key: String(s.key || ''),
            value: String(s.value || ''),
          }))
          : Array.from({ length: INGREDIENTS_COUNT }, () => createEmptyIngredient());
      setIngredients(ingredientRows);

      const nutritionRows =
        Array.isArray(product.nutritions) && product.nutritions.length
          ? product.nutritions.map((s: Record<string, unknown>) => ({
            key: String(s.key || ''),
            value: String(s.value || ''),
          }))
          : Array.from({ length: NUTRITIONS_COUNT }, () => createEmptyNutrition());
      setNutritions(nutritionRows);

      const specificationRows =
        Array.isArray(product.specifications) && product.specifications.length
          ? product.specifications.map((s: Record<string, unknown>) => ({
            key: String(s.key || ''),
            value: String(s.value || ''),
          }))
          : Array.from({ length: SPECIFICATIONS_COUNT }, () => createEmptySpecification());
      setSpecifications(specificationRows);

      const mappedVariants: VariantRow[] =
        Array.isArray(product.variants) && product.variants.length
          ? product.variants.map((v: Record<string, unknown>) => {
            const label = String(v.label || '');
            let weight = '';
            let weightUnit: WeightUnit = 'GM';

            if (label) {
              const match = label.match(/^(\d+)([a-zA-Z]+)$/);
              if (match) {
                weight = match[1];
                weightUnit = match[2].toUpperCase() as WeightUnit;
              } else {
                weight = label;
              }
            }

            return {
              weight,
              weightUnit,
              price: String(v.price || ''),
              discountedPrice: String(v.selling_price || v.originalPrice || v.price || ''),
              stock: Number(v.stock || 0),
              stockLocked: Number(v.stock || 0) <= 0,
              images: [],
              existingImages: Array.isArray(v.images) && v.images.length
                ? (v.images as unknown[]).map((img) => String(img || '')).filter(Boolean)
                : (v.image ? [String(v.image || '')] : []),
            };
          })
          : [createEmptyVariant()];
      setVariants(mappedVariants);
      setHasHydratedDescription(false);

      const textLength = stripHtmlToPlainText(toEditorHtml(product.description || '')).length;
      setDescriptionTextLength(textLength);
      lastValidDescriptionHtmlRef.current = toEditorHtml(product.description || '');
    } else {
      resetEditor();
    }
  }, [open, product]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setRenameCategoryName('');
      setRenameCategoryStatus('');
      return;
    }
    const currentName = findCategoryNameById(categories, selectedCategoryId) ?? '';
    setRenameCategoryName(currentName);
    setRenameCategoryStatus('');
  }, [selectedCategoryId, categories]);

  useEffect(() => {
    if (step !== 2 || hasHydratedDescription) return;
    if (!editorRef.current) return;
    if (!description) return;
    editorRef.current.innerHTML = description;
    setHasHydratedDescription(true);
  }, [step, description, hasHydratedDescription]);

  useEffect(() => {
    if (step === 2) return;
    if (!hasHydratedDescription) return;
    // Step 2 UI (contentEditable) unmounts when navigating away.
    // Reset hydration flag so coming back rehydrates from `description` state.
    setHasHydratedDescription(false);
  }, [step, hasHydratedDescription]);

  useEffect(() => {
    if (!open) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const adminScrollRoot = document.getElementById('admin-scroll-root');
    const previousAdminOverflow = adminScrollRoot?.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (adminScrollRoot) adminScrollRoot.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      if (adminScrollRoot) adminScrollRoot.style.overflow = previousAdminOverflow || '';
    };
  }, [open]);

  const syncDescriptionFromEditor = () => {
    const html = editorRef.current?.innerHTML || '';
    const textLength = stripHtmlToPlainText(html).length;
    setDescription(html);
    setDescriptionTextLength(textLength);
    lastValidDescriptionHtmlRef.current = html;
  };

  const commitDescriptionIfEditing = () => {
    if (step !== 2) return;
    syncDescriptionFromEditor();
  };

  const saveEditorSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    savedSelectionRef.current = range.cloneRange();
  };

  const restoreEditorSelection = () => {
    const selection = window.getSelection();
    const range = savedSelectionRef.current;
    const editor = editorRef.current;
    if (!selection || !range || !editor) return;
    if (!editor.contains(range.commonAncestorContainer)) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleDescriptionInput: FormEventHandler<HTMLDivElement> = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.innerHTML;
    const textLength = stripHtmlToPlainText(html).length;

    if (textLength > DESCRIPTION_MAX_LENGTH) {
      editor.innerHTML = lastValidDescriptionHtmlRef.current;
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    setDescription(html);
    setDescriptionTextLength(textLength);
    lastValidDescriptionHtmlRef.current = html;
  };

  const handleDescriptionPaste: ClipboardEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData('text/plain') || '';
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreEditorSelection();
    insertPlainTextAtCaret(plainText);
    saveEditorSelection();
    syncDescriptionFromEditor();
  };

  const runDescriptionCommand = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreEditorSelection();
    if (command === 'foreColor' || command === 'hiliteColor') {
      document.execCommand('styleWithCSS', false, 'true');
    }
    document.execCommand(command, false, value);
    saveEditorSelection();
    syncDescriptionFromEditor();
  };

  const applyDescriptionHeading = (value: 'P' | 'H1' | 'H2' | 'H3') => {
    const map: Record<'P' | 'H1' | 'H2' | 'H3', string> = {
      P: '<p>',
      H1: '<h1>',
      H2: '<h2>',
      H3: '<h3>',
    };
    runDescriptionCommand('formatBlock', map[value]);
  };

  const keepEditorSelectionOnToolbarMouseDown: MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!selectedCategoryId) return 'Select a category.';
      return '';
    }
    if (currentStep === 2) {
      if (!name.trim()) return 'Product name is required.';
      if (!descriptionTextLength || descriptionTextLength < 10) return 'Description is too short.';
      return '';
    }
    if (currentStep === 3) {
      if (!variants.length) return 'Add at least one variant.';
      if (variants.some((v) => !String(v.weight || '').trim() || !String(v.price || '').trim())) {
        return 'Each variant needs weight and price.';
      }
      return '';
    }
    return '';
  };

  const handleNext = () => {
    commitDescriptionIfEditing();
    const validationError = validateStep(step);
    if (validationError) {
      onError(validationError);
      return;
    }
    onError('');
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    commitDescriptionIfEditing();
    onError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const addChildCategory = async () => {
    const nameValue = newCategoryName.trim();
    if (!nameValue) return;
    try {
      await createAdminCategory(nameValue, selectedCategoryId || undefined);
      setNewCategoryName('');
      onSaved();
    } catch {
      onError('Category create failed. Name may already exist at this level.');
    }
  };

  const saveProduct = async () => {
    const validationError = validateStep(2) || validateStep(3);
    if (validationError) {
      onError(validationError);
      return;
    }

    setIsSubmitting(true);
    onError('');

    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('title', name.trim());
      form.append('description', description);
      form.append('categoryId', selectedCategoryId);
      form.append('status', 'published');
      form.append('draft_stage', 'complete');
      form.append('key_highlights', JSON.stringify(highlights.filter((item) => item.key.trim() && item.value.trim())));
      form.append('sku', sku);
      form.append('cod_available', codAvailable ? 'true' : 'false');
      form.append('ingredients', JSON.stringify(ingredients.filter((i) => i.key.trim() && i.value.trim())));
      form.append('nutritions', JSON.stringify(nutritions.filter((n) => n.key.trim() && n.value.trim())));
      form.append('specification', JSON.stringify(specifications.filter((item) => item.key.trim() && item.value.trim())));

      const backendVariants = variants.map((v) => {
        const originalPrice = Number(v.price || 0);
        const sellingPrice = Number(v.discountedPrice || 0) || originalPrice;

        return {
          label: v.weight.trim() + v.weightUnit,
          stock: Number(v.stock || 0),
          price: originalPrice,
          originalPrice,
          selling_price: sellingPrice,
          image: v.images.length > 0 ? '' : (v.existingImages?.[0] || ''),
          existingImages: v.images.length > 0 ? [] : (v.existingImages || []),
        };
      });
      form.append('variants', JSON.stringify(backendVariants));

      const primaryVariant = backendVariants[0];
      if (primaryVariant) {
        form.append('price', String(primaryVariant.price || 0));
        form.append('selling_price', String(primaryVariant.selling_price || primaryVariant.price || 0));
        form.append(
          'quantity',
          String(backendVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0))
        );
      }

      variants.forEach((v, variantIdx) => {
        v.images.forEach((file) => {
          form.append('variantImages', file);
          form.append('variantImageIndexes', String(variantIdx));
        });
      });

      if (editingProductId) {
        await updateAdminProduct(editingProductId, form);
      } else {
        await createAdminProduct(form);
      }

      onSaved();
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const toolbarActions: ToolbarAction[] = [
    { label: 'P', onClick: () => applyDescriptionHeading('P') },
    { label: 'H1', onClick: () => applyDescriptionHeading('H1') },
    { label: 'H2', onClick: () => applyDescriptionHeading('H2') },
    { label: 'H3', onClick: () => applyDescriptionHeading('H3') },
    { label: 'Bold', onClick: () => runDescriptionCommand('bold') },
    { label: 'Italic', onClick: () => runDescriptionCommand('italic') },
    { label: 'Underline', onClick: () => runDescriptionCommand('underline') },
    { label: 'UL', onClick: () => runDescriptionCommand('insertUnorderedList') },
    { label: 'OL', onClick: () => runDescriptionCommand('insertOrderedList') },
    { label: 'Clear', onClick: () => runDescriptionCommand('removeFormat') },
  ];

  return (
    <section className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-2 backdrop-blur-md sm:p-4 md:p-6">
      <div className="mx-auto min-h-full max-w-7xl">
        <div className="flex min-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/25 sm:min-h-[calc(100vh-2rem)]">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 md:px-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">
                  Step {step}/3
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-5xl">
                  {editingProductId ? 'Edit Product' : 'Create Product'}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <StepBadge active={step === 1} done={step > 1} label="Category" />
              <StepBadge active={step === 2} done={step > 2} label="Details" />
              <StepBadge active={step === 3} done={false} label="Variants" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-7">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Select Category
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick the product’s final category and add a new one if needed.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    Choose the leaf category for this product.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Add New Category
                  </label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Add new category"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />
                    <button
                      onClick={addChildCategory}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Create Category
                    </button>
                  </div>
                </div>

                {selectedCategoryId ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                          Rename Selected Category
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Change the currently selected category name.
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {findCategoryNameById(categories, selectedCategoryId) || 'Selected'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        value={renameCategoryName}
                        onChange={(e) => setRenameCategoryName(e.target.value)}
                        placeholder="Rename selected category"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                      />
                      <button
                        onClick={async () => {
                          if (!selectedCategoryId) return;
                          const newName = renameCategoryName.trim();
                          if (!newName) return;
                          if (newName === findCategoryNameById(categories, selectedCategoryId)) return;
                          setRenameCategoryBusy(true);
                          setRenameCategoryStatus('');
                          try {
                            await updateAdminCategory(selectedCategoryId, newName);
                            setRenameCategoryStatus('Category renamed successfully.');
                            onSaved();
                          } catch {
                            setRenameCategoryStatus('Rename failed.');
                          } finally {
                            setRenameCategoryBusy(false);
                          }
                        }}
                        disabled={renameCategoryBusy || !renameCategoryName.trim()}
                        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Rename
                      </button>
                    </div>
                    {renameCategoryStatus ? (
                      <p className="mt-3 text-sm text-slate-500">{renameCategoryStatus}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Product Story + Selling Details
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Build a cleaner listing for masalas, oils, and pantry products with useful buyer-facing content.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      Product Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Cold Pressed Mustard Oil / Turmeric Powder"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      SKU Code
                    </label>
                    <input
                      value={sku}
                      onChange={(e) => setSku(normalizeSkuInput(e.target.value))}
                      maxLength={6}
                      placeholder="GA-101"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm tracking-widest outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                    <p className="mt-2 text-xs text-slate-500">Format: AB-123</p>
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                          Description
                        </label>
                        <p className="mt-1 text-sm text-slate-500">
                          Describe aroma, purity, processing method, and ideal kitchen use.
                        </p>
                      </div>
                      <p
                        className={`text-xs font-semibold ${descriptionTextLength > DESCRIPTION_MAX_LENGTH
                          ? 'text-rose-600'
                          : 'text-slate-500'
                          }`}
                      >
                        {descriptionTextLength}/{DESCRIPTION_MAX_LENGTH}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-2">
                        {toolbarActions.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onMouseDown={keepEditorSelectionOnToolbarMouseDown}
                            onClick={item.onClick}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            {item.label}
                          </button>
                        ))}

                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                          Color
                          <input
                            type="color"
                            defaultValue="#111827"
                            onMouseDown={keepEditorSelectionOnToolbarMouseDown}
                            onChange={(e) => runDescriptionCommand('foreColor', e.target.value)}
                            className="h-5 w-8 cursor-pointer border-0 bg-transparent p-0"
                          />
                        </label>
                      </div>

                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleDescriptionInput}
                        onPaste={handleDescriptionPaste}
                        onBlur={syncDescriptionFromEditor}
                        onMouseUp={saveEditorSelection}
                        onKeyUp={saveEditorSelection}
                        onFocus={saveEditorSelection}
                        className="min-h-44 max-h-80 overflow-y-auto px-4 py-3 text-sm leading-6 text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-xl font-semibold tracking-tight text-slate-900">
                        Quick Highlights
                      </h4>
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {HIGHLIGHTS_COUNT} points
                      </span>
                    </div>

                    <div className="space-y-3">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3">
                          <input
                            value={highlight.key}
                            onChange={(e) => {
                              const next = [...highlights];
                              next[index] = { ...next[index], key: e.target.value };
                              setHighlights(next);
                            }}
                            placeholder="Highlight label"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-5"
                          />
                          <input
                            value={highlight.value}
                            onChange={(e) => {
                              const next = [...highlights];
                              next[index] = { ...next[index], value: e.target.value };
                              setHighlights(next);
                            }}
                            placeholder="Eg. Wood pressed, single origin, no fillers"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-7"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-xl font-semibold tracking-tight text-slate-900">
                        Storage, Shelf Life & Usage
                      </h4>
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {SPECIFICATIONS_COUNT} points
                      </span>
                    </div>

                    <div className="space-y-3">
                      {specifications.map((specification, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3">
                          <input
                            value={specification.key}
                            onChange={(e) => {
                              const next = [...specifications];
                              next[index] = { ...next[index], key: e.target.value };
                              setSpecifications(next);
                            }}
                            placeholder="Shelf life / Storage / Best for"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-5"
                          />
                          <input
                            value={specification.value}
                            onChange={(e) => {
                              const next = [...specifications];
                              next[index] = { ...next[index], value: e.target.value };
                              setSpecifications(next);
                            }}
                            placeholder="Eg. 9 months, airtight jar, ideal for tadka"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-7"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-xl font-semibold tracking-tight text-slate-900">
                        Blend & Ingredient Details
                      </h4>
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {INGREDIENTS_COUNT} points
                      </span>
                    </div>

                    <div className="space-y-3">
                      {ingredients.map((ingredient, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3">
                          <input
                            value={ingredient.key}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[index] = { ...next[index], key: e.target.value };
                              setIngredients(next);
                            }}
                            placeholder="Ingredient / source"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-5"
                          />
                          <input
                            value={ingredient.value}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[index] = { ...next[index], value: e.target.value };
                              setIngredients(next);
                            }}
                            placeholder="Eg. Stone ground chilli, mustard seed, no additives"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-7"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-xl font-semibold tracking-tight text-slate-900">
                        Kitchen Facts & Usage Notes
                      </h4>
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {NUTRITIONS_COUNT} points
                      </span>
                    </div>

                    <div className="space-y-3">
                      {nutritions.map((nutrition, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3">
                          <input
                            value={nutrition.key}
                            onChange={(e) => {
                              const next = [...nutritions];
                              next[index] = { ...next[index], key: e.target.value };
                              setNutritions(next);
                            }}
                            placeholder="Aroma / Heat level / Best for"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-5"
                          />
                          <input
                            value={nutrition.value}
                            onChange={(e) => {
                              const next = [...nutritions];
                              next[index] = { ...next[index], value: e.target.value };
                              setNutritions(next);
                            }}
                            placeholder="Eg. Earthy aroma, medium spice, great for curries"
                            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:col-span-7"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Pack Variants + Pricing + Stock
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add one or more pack sizes with pricing, stock, and image support.
                  </p>
                </div>

                <div className="space-y-5">
                  {variants.map((variant, variantIndex) => (
                    <div
                      key={variantIndex}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <h4 className="text-xl font-semibold tracking-tight text-slate-900">
                          Variant #{variantIndex + 1}
                        </h4>
                        <button
                          onClick={() => {
                            const confirmed = window.confirm('Remove this pack variant?');
                            if (!confirmed) return;
                            setVariants((prev) =>
                              prev.length === 1 ? prev : prev.filter((_, i) => i !== variantIndex)
                            );
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Weight Value
                          </label>
                          <input
                            type="number"
                            value={variant.weight}
                            onChange={(e) => {
                              const next = [...variants];
                              next[variantIndex] = { ...next[variantIndex], weight: e.target.value };
                              setVariants(next);
                            }}
                            placeholder="e.g., 250, 500, 1"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Weight Unit
                          </label>
                          <select
                            value={variant.weightUnit}
                            onChange={(e) => {
                              const next = [...variants];
                              next[variantIndex] = {
                                ...next[variantIndex],
                                weightUnit: e.target.value as WeightUnit,
                              };
                              setVariants(next);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                          >
                            {WEIGHT_UNIT_OPTIONS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Price ({currency})
                          </label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => {
                              const next = [...variants];
                              next[variantIndex] = { ...next[variantIndex], price: e.target.value };
                              setVariants(next);
                            }}
                            placeholder="Original price"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Discounted Price ({currency})
                          </label>
                          <input
                            type="number"
                            value={variant.discountedPrice}
                            onChange={(e) => {
                              const next = [...variants];
                              next[variantIndex] = {
                                ...next[variantIndex],
                                discountedPrice: e.target.value,
                              };
                              setVariants(next);
                            }}
                            placeholder="Selling price"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Stock Quantity
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...variants];
                              const current = next[variantIndex];
                              next[variantIndex] = current.stockLocked
                                ? { ...current, stockLocked: false }
                                : { ...current, stock: 0, stockLocked: true };
                              setVariants(next);
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              variant.stockLocked
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {variant.stockLocked ? 'Edit stock' : 'Mark as out of stock'}
                          </button>
                        </div>
                        <input
                          type="number"
                          value={variant.stock}
                          disabled={variant.stockLocked}
                          onChange={(e) => {
                            const next = [...variants];
                            next[variantIndex] = {
                              ...next[variantIndex],
                              stock: Number(e.target.value || 0),
                            };
                            setVariants(next);
                          }}
                          placeholder="Available stock"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        {variant.stockLocked ? (
                          <p className="mt-2 text-xs font-medium text-rose-600">
                            This variant is marked out of stock and will save with stock 0.
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                          Variant Images (max 4)
                        </label>
                        <input
                          id={`variant-images-${variantIndex}`}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const next = [...variants];
                            const currentImages = Array.isArray(next[variantIndex].images)
                              ? next[variantIndex].images
                              : [];
                            const existingSignatures = new Set(
                              currentImages.map((file) => fileSignature(file))
                            );
                            const uniqueNewFiles = files.filter(
                              (file) => !existingSignatures.has(fileSignature(file))
                            );
                            const mergedFiles = [...currentImages, ...uniqueNewFiles];

                            if (mergedFiles.length > 4) {
                              onError('Maximum 4 images allowed per variant.');
                              next[variantIndex] = {
                                ...next[variantIndex],
                                images: mergedFiles.slice(0, 4),
                                existingImages: [],
                              };
                              setVariants(next);
                              e.currentTarget.value = '';
                              return;
                            }
                            onError('');
                            next[variantIndex] = {
                              ...next[variantIndex],
                              images: mergedFiles,
                              existingImages: mergedFiles.length > 0 ? [] : next[variantIndex].existingImages,
                            };
                            setVariants(next);
                            e.currentTarget.value = '';
                          }}
                          className="hidden"
                        />

                        <div className="flex flex-wrap items-center gap-3">
                          <label
                            htmlFor={`variant-images-${variantIndex}`}
                            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Choose Images
                          </label>

                          <span className="text-xs text-slate-500">
                            PNG or JPG, square `500 x 500` recommended, up to 4 images.
                          </span>
                        </div>

                        {variant.existingImages.length > 0 && variant.images.length === 0 ? (
                          <div className="flex gap-3 overflow-x-auto pt-2 pb-1">
                            {variant.existingImages.slice(0, 4).map((src) => (
                              <div
                                key={src}
                                className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                              >
                                <ResilientProductImage
                                  sources={[src]}
                                  alt="Existing variant"
                                  className="h-full w-full object-cover"
                                  fallbackClassName="bg-slate-100 text-slate-400"
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {variant.images.length > 0 ? (
                          <div className="flex gap-3 overflow-x-auto pt-2 pb-1">
                            {variant.images.slice(0, 4).map((file, imageIndex) => (
                              <div
                                key={`${file.name}-${file.lastModified}-${file.size}`}
                                className="relative"
                              >
                                <LocalImagePreview file={file} />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...variants];
                                    next[variantIndex] = {
                                      ...next[variantIndex],
                                      images: next[variantIndex].images.filter((_, idx) => idx !== imageIndex),
                                    };
                                    setVariants(next);
                                  }}
                                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white shadow-md transition hover:bg-rose-700"
                                  aria-label="Remove selected image"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...variants];
                              next[variantIndex] = { ...next[variantIndex], images: [], existingImages: [] };
                              setVariants(next);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Clear Selection
                          </button>
                          <span className="text-xs text-slate-500">
                            Selected: {variant.images.length || variant.existingImages.length}/4
                          </span>
                        </div>
                      </div>

                      {variant.weight && (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Full Weight Label
                          </p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                            {variant.weight}
                            {variant.weightUnit}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                     <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        Payment Option
                      </p>
                      <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                        Cash on Delivery
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Razorpay remains available by default. Enable COD only for this product.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={codAvailable}
                      onClick={() => setCodAvailable((prev) => !prev)}
                      className={`relative h-8 w-16 shrink-0 rounded-full border transition ${codAvailable
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300 bg-slate-200'
                        }`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${codAvailable ? 'left-8' : 'left-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setVariants((prev) => [...prev, createEmptyVariant()])}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Add Pack Variant
                  </button>

                  <div className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    Total Stock: {totalStock}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-7">
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
              >
                Back
              </button>
              {step < 3 && (
                <button
                  onClick={handleNext}
                  className="rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Next
                </button>
              )}
            </div>

            {step === 3 && (
              <button
                onClick={saveProduct}
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Publishing...' : editingProductId ? 'Update Product' : 'Publish Product'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
