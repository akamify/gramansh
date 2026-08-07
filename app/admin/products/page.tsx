'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSiteSettings } from '@/app/context/SiteSettingsContext';
import {
  fetchAdminProductsLite,
  fetchAdminCategoriesTree,
  deleteAdminProduct,
} from '@/app/lib/apiClient';

import {
  CategoryNode,
  ProductItem,
  normalizeCategoryNodes,
} from './utils/admin-products.utils';

import ProductHeader from './components/ProductHeader';
import ProductTable from './components/ProductTable';
import ProductEditor from './components/ProductEditor';

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSiteSettings();
  const currency = settings.currencySymbol || '$';

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const totalProducts = products.length;
  const publishedProducts = useMemo(
    () => products.filter((p) => String(p.status || '').toLowerCase() === 'published').length,
    [products]
  );
  const draftProducts = totalProducts - publishedProducts;

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const categoryName = typeof p.catagory_id === 'object' ? p.catagory_id?.name || '' : '';
      return (
        String(p.product_id).includes(q) ||
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.sku || '').toLowerCase().includes(q) ||
        String(categoryName).toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [liteProducts, categoriesResult] = await Promise.all([
        fetchAdminProductsLite(),
        fetchAdminCategoriesTree(),
      ]);

      const mappedProducts = liteProducts.map((p) => ({
        _id: p._id,
        product_id: p.product_id ?? 0,
        name: p.name || '',
        title: p.title || p.name || '',
        sku: p.sku,
        description: p.description,
        key_highlights: p.key_highlights,
        ingredients: p.ingredients,
        nutritions: p.nutritions,
        specifications: p.specifications,
        catagory_id: p.catagory_id,
        variants: p.variants,
        product_image: p.product_image || (p.image ? [p.image] : []),
        price: p.price,
        selling_price: p.selling_price,
        quantity: p.quantity,
        status: p.status,
        cod_available: p.cod_available,
        codAvailable: p.codAvailable,
      }));

      setProducts(mappedProducts);
      setCategories(normalizeCategoryNodes(categoriesResult as unknown[]));
    } catch {
      setError('Failed to load admin data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const id = searchParams.get('productId');

    if (loading) return;

    if (mode === 'new') {
      setEditingProduct(null);
      setIsEditorOpen(true);
      return;
    }

    if (mode === 'edit' && id) {
      const numericId = Number(id);
      if (Number.isFinite(numericId)) {
        const product = products.find((p) => p.product_id === numericId) || null;
        setEditingProduct(product);
        setIsEditorOpen(true);
      }
    }
  }, [searchParams, loading, products]);

  const openNew = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
    router.push('/admin/products?mode=new');
  };

  const openEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setIsEditorOpen(true);
    router.push(`/admin/products?mode=edit&productId=${product.product_id}`);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingProduct(null);
    router.push('/admin/products');
  };

  const deleteProduct = async (productId: number) => {
    const ok = window.confirm(`Delete product ${productId}?`);
    if (!ok) return;
    try {
      const target = products.find((p) => p.product_id === productId);
      await deleteAdminProduct(productId, target?._id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl p-4">
        <ProductHeader
          search={search}
          onSearchChange={setSearch}
          onNewProduct={openNew}
          totalProducts={totalProducts}
          publishedProducts={publishedProducts}
          draftProducts={draftProducts}
        />

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <ProductTable
          products={filteredProducts}
          loading={loading}
          currency={currency}
          onEdit={openEdit}
          onDelete={deleteProduct}
        />
      </div>

      <ProductEditor
        open={isEditorOpen}
        product={editingProduct}
        categories={categories}
        onClose={closeEditor}
        onSaved={loadData}
        onError={setError}
      />
    </main>
  );
}
