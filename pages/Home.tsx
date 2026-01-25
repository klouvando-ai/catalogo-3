
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';

const Home: React.FC = () => {
  const { products, categories } = useData();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Todos';
  const searchQuery = searchParams.get('q') || '';

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const activeCategoryObj = categories.find(c => c.name === activeCategory);
    const activeCategoryId = activeCategoryObj?.id;

    return sortedProducts.filter(p => {
      if (activeCategory !== 'Todos' && activeCategoryId) {
        if (!p.categoryIds?.includes(activeCategoryId)) {
          return false;
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (p.name.toLowerCase().includes(q)) return true;
        return p.variants.some(v => 
          v.reference.toLowerCase().includes(q) || 
          (v.name && v.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sortedProducts, activeCategory, searchQuery, categories]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10">
      
      {/* Hero Section - Compacto no Mobile */}
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-2 md:mb-4">Coleção Exclusiva</h1>
        <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto px-4">
          Moda premium para revenda. Qualidade e sofisticação em cada detalhe.
        </p>
      </div>

      {/* Grid: 2 Colunas no mobile, 4 no desktop */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 mx-2">
          <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="text-xs text-gray-500 mt-1">Tente ajustar sua busca.</p>
        </div>
      )}
      
      {/* Espaçamento inferior para mobile */}
      <div className="h-10 md:hidden"></div>
    </div>
  );
};

export default Home;
