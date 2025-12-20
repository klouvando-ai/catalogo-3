
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ReferenceDefinition, ProductVariant } from '../types';
import { api } from '../lib/api';

interface DataContextType {
  products: Product[];
  references: ReferenceDefinition[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  addReference: (ref: ReferenceDefinition) => Promise<void>;
  updateReference: (ref: ReferenceDefinition) => Promise<void>;
  deleteReference: (id: string) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [references, setReferences] = useState<ReferenceDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [refsData, prodData] = await Promise.all([
        api.references.list(),
        api.products.list()
      ]);

      setReferences(refsData);

      const mappedProducts: Product[] = prodData.map((item: any) => {
        const referenceIds: string[] = item.referenceIds || [];
        const dynamicVariants: ProductVariant[] = [];
        
        referenceIds.forEach(refId => {
          const refDef = refsData.find((r: any) => r.id === refId);
          if (refDef) {
            dynamicVariants.push({
              id: refDef.id,
              name: refDef.name,
              reference: refDef.code,
              sizeRange: refDef.sizeRange,
              priceRepresentative: refDef.priceRepresentative,
              priceSacoleira: refDef.priceSacoleira,
              colors: refDef.colors
            });
          }
        });

        return {
          ...item,
          variants: dynamicVariants.length > 0 ? dynamicVariants : (item.variants || [])
        };
      });

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addReference = async (ref: ReferenceDefinition) => {
    await api.references.create(ref);
    await fetchData();
  };

  const updateReference = async (ref: ReferenceDefinition) => {
    await api.references.update(ref.id, ref);
    await fetchData();
  };

  const deleteReference = async (id: string) => {
    await api.references.delete(id);
    await fetchData();
  };

  const addProduct = async (product: Product) => {
    await api.products.create(product);
    await fetchData();
  };

  const updateProduct = async (product: Product) => {
    await api.products.update(product.id, product);
    await fetchData();
  };

  const deleteProduct = async (id: string) => {
    await api.products.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProduct = (id: string) => products.find(p => p.id === id);

  return (
    <DataContext.Provider value={{ 
      products, references, addProduct, updateProduct, deleteProduct, 
      getProduct, addReference, updateReference, deleteReference, isLoading 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
