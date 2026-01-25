
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ReferenceDefinition, ProductVariant, Category } from '../types';
import { api } from '../lib/api';

interface DataContextType {
  products: Product[];
  references: ReferenceDefinition[];
  categories: Category[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  addReference: (ref: ReferenceDefinition) => Promise<void>;
  updateReference: (ref: ReferenceDefinition) => Promise<void>;
  deleteReference: (id: string) => Promise<void>;
  addCategory: (cat: Category) => Promise<void>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const safeParse = (data: any): any[] => {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch (e) { return []; }
  }
  return Array.isArray(data) ? data : [];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [references, setReferences] = useState<ReferenceDefinition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rawRefs, rawProds, rawCats] = await Promise.all([
        api.references.list(),
        api.products.list(),
        api.categories.list()
      ]);

      setCategories(rawCats);

      const mappedRefs: ReferenceDefinition[] = rawRefs.map((ref: any) => ({
        ...ref,
        priceRepresentative: Number(ref.priceRepresentative),
        priceSacoleira: Number(ref.priceSacoleira),
        colors: safeParse(ref.colors)
      }));
      setReferences(mappedRefs);

      const mappedProducts: Product[] = rawProds.map((item: any) => {
        const referenceIds = safeParse(item.referenceIds);
        const images = safeParse(item.images);
        const categoryIds = safeParse(item.categoryIds);
        const dynamicVariants: ProductVariant[] = [];
        referenceIds.forEach((refId: string) => {
          const refDef = mappedRefs.find((r: any) => r.id === refId);
          if (refDef) {
            dynamicVariants.push({
              id: refDef.id, name: refDef.name, reference: refDef.code,
              sizeRange: refDef.sizeRange, priceRepresentative: refDef.priceRepresentative,
              priceSacoleira: refDef.priceSacoleira, colors: refDef.colors
            });
          }
        });
        return { ...item, images, referenceIds, categoryIds, isFeatured: Boolean(item.isFeatured), variants: dynamicVariants };
      });
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addReference = async (ref: ReferenceDefinition) => { await api.references.create(ref); await fetchData(); };
  const updateReference = async (ref: ReferenceDefinition) => { await api.references.update(ref.id, ref); await fetchData(); };
  const deleteReference = async (id: string) => { await api.references.delete(id); await fetchData(); };
  
  const addProduct = async (product: Product) => { await api.products.create(product); await fetchData(); };
  const updateProduct = async (product: Product) => { await api.products.update(product.id, product); await fetchData(); };
  const deleteProduct = async (id: string) => { await api.products.delete(id); await fetchData(); };

  const addCategory = async (cat: Category) => { await api.categories.create(cat); await fetchData(); };
  const updateCategory = async (cat: Category) => { await api.categories.update(cat.id, cat); await fetchData(); };
  const deleteCategory = async (id: string) => { await api.categories.delete(id); await fetchData(); };

  const getProduct = (id: string) => products.find(p => p.id === id);

  return (
    <DataContext.Provider value={{ 
      products, references, categories, addProduct, updateProduct, deleteProduct, 
      getProduct, addReference, updateReference, deleteReference,
      addCategory, updateCategory, deleteCategory, isLoading 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData error');
  return context;
};
