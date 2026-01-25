
import React from 'react';
import { Product, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  const { categories } = useData();

  const getPriceRange = () => {
    if (!user) return null;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let hasPrice = false;

    product.variants.forEach(v => {
      const price = user.role === UserRole.SACOLEIRA ? v.priceSacoleira : v.priceRepresentative;
      if (price) {
        hasPrice = true;
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;
      }
    });

    if (!hasPrice) return null;
    if (minPrice === maxPrice) return `R$ ${minPrice.toFixed(2)}`;
    return `R$ ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
  };

  const getPrimaryCategoryName = () => {
    if (!product.categoryIds || product.categoryIds.length === 0) return 'Sem Categoria';
    const primaryCategoryId = product.categoryIds[0];
    const category = categories.find(c => c.id === primaryCategoryId);
    return category ? category.name : '';
  };

  const coverImage = product.images[product.coverImageIndex] || product.images[0];
  const priceDisplay = getPriceRange();
  const sizesAvailable = Array.from(new Set(product.variants.map(v => v.sizeRange)));
  const references = Array.from(new Set(product.variants.map(v => v.reference)));
  const primaryCategoryName = getPrimaryCategoryName();

  return (
    <Link to={`/product/${product.id}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
      <div className="aspect-portrait w-full relative bg-gray-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">Sem Imagem</div>
        )}
        
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-secondary text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-sm shadow-sm">
            Destaque
          </div>
        )}
      </div>

      <div className="p-3 md:p-4">
        {primaryCategoryName && (
          <div className="mb-0.5 text-[10px] text-secondary font-bold uppercase tracking-wide truncate">
              {primaryCategoryName}
          </div>
        )}
        <h3 className="text-sm md:text-lg font-medium text-gray-900 group-hover:text-secondary truncate leading-tight">
          {product.name}
        </h3>
        
        <div className="mt-1.5 flex flex-wrap gap-1">
             {sizesAvailable.slice(0, 2).map(size => (
                 <span key={size} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[9px] md:text-xs font-semibold">
                     {size}
                 </span>
             ))}
             {sizesAvailable.length > 2 && <span className="text-[9px] text-gray-400">+{sizesAvailable.length - 2}</span>}
        </div>

        <div className="mt-1 text-[9px] md:text-xs text-gray-400 truncate opacity-75">
             Ref: {references.join(' / ')}
        </div>

        <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between">
           {user ? (
             <span className="text-sm md:text-lg font-bold text-gray-900">
                {priceDisplay || "Consulte"}
             </span>
           ) : (
             <span className="text-[10px] md:text-xs text-secondary font-bold uppercase">
               Ver preço
             </span>
           )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
