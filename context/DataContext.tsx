
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

// Função auxiliar para lidar com campos JSON do MySQL que podem vir como string
const safeParse = (data: any): any[] => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Erro ao parsear JSON:", e, data);
      return [];
    }
  }
  return Array.isArray(data) ? data : [];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [references, setReferences] = useState<ReferenceDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rawRefs, rawProds] = await Promise.all([
        api.references.list(),
        api.products.list()
      ]);

      // Normalizar Referências
      const mappedRefs: ReferenceDefinition[] = rawRefs.map((ref: any) => ({
        ...ref,
        priceRepresentative: Number(ref.priceRepresentative),
        priceSacoleira: Number(ref.priceSacoleira),
        colors: safeParse(ref.colors)
      }));

      setReferences(mappedRefs);

      // Normalizar Produtos e Injetar Referências (Variantes)
      const mappedProducts: Product[] = rawProds.map((item: any) => {
        const referenceIds = safeParse(item.referenceIds);
        const images = safeParse(item.images);
        const dynamicVariants: ProductVariant[] = [];
        
        referenceIds.forEach((refId: string) => {
          const refDef = mappedRefs.find((r: any) => r.id === refId);
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
          images,
          referenceIds,
          isFeatured: Boolean(item.isFeatured),
          variants: dynamicVariants
        };
      });

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erro crítico ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addReference = async (ref: ReferenceDefinition) => {
    try {
      await api.references.create(ref);
      await fetchData();
    } catch (e) {
      console.error("Erro ao adicionar referência:", e);
      alert("Erro ao salvar referência.");
    }
  };

  const updateReference = async (ref: ReferenceDefinition) => {
    try {
      await api.references.update(ref.id, ref);
      await fetchData();
    } catch (e) {
      console.error("Erro ao atualizar referência:", e);
    }
  };

  const deleteReference = async (id: string) => {
    try {
      await api.references.delete(id);
      await fetchData();
    } catch (e) {
      console.error("Erro ao deletar referência:", e);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      await api.products.create(product);
      await fetchData();
    } catch (e) {
      console.error("Erro ao adicionar produto:", e);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      await api.products.update(product.id, product);
      await fetchData();
    } catch (e) {
      console.error("Erro ao atualizar produto:", e);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.products.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error("Erro ao deletar produto:", e);
    }
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
