
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ChevronLeft, Edit, Share2 } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProduct } = useData();
  const { user } = useAuth();
  const product = getProduct(id || '');
  const [activeImageIndex, setActiveImageIndex] = useState(product?.coverImageIndex || 0);

  if (!product) {
    return <div className="p-10 text-center font-serif">Produto não encontrado.</div>;
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Confira este produto: ${product.name}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Navegação Superior Fixa/Mobile */}
      <div className="flex justify-between items-center p-4 md:px-8 md:py-6 bg-white md:bg-transparent sticky md:relative top-0 z-40 border-b md:border-0">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary transition font-medium text-sm">
            <ChevronLeft className="h-5 w-5 mr-1" /> Catálogo
        </Link>
        <div className="flex gap-2">
            <button onClick={handleShare} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full md:hidden">
                <Share2 size={20} />
            </button>
            {user?.role === UserRole.ADMIN && (
                <Link to={`/admin/edit/${product.id}`} className="inline-flex items-center p-2 md:px-4 md:py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full md:rounded-md text-gray-700 bg-white">
                    <Edit className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Editar</span>
                </Link>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 px-0 md:px-8">
        
        {/* Gallery: Full width on mobile */}
        <div className="space-y-4">
          <div className="aspect-portrait bg-gray-100 md:rounded-2xl overflow-hidden shadow-sm">
            {product.images[activeImageIndex] && (
               <img 
                 src={product.images[activeImageIndex]} 
                 alt={product.name} 
                 className="w-full h-full object-cover"
               />
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-0 pb-2">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`flex-shrink-0 w-20 md:w-24 aspect-portrait rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-secondary scale-95' : 'border-transparent opacity-70'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info: Padding on mobile */}
        <div className="px-5 md:px-0 pt-6">
           <div className="mb-2">
             <span className="text-xs font-bold text-secondary uppercase tracking-widest">{product.category}</span>
           </div>
           <h1 className="text-2xl md:text-4xl font-serif font-bold text-gray-900 mb-4">{product.name}</h1>
           
           <div className="text-gray-600 mb-8 leading-relaxed text-sm md:text-base">
             <p>{product.description}</p>
             {product.fabric && (
               <p className="mt-3 inline-block bg-accent px-3 py-1 rounded-full text-xs font-medium">Tecido: {product.fabric}</p>
             )}
           </div>

           <div className="border-t border-gray-100 pt-8 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 font-serif">Referências e Cores</h3>
              
              <div className="space-y-4">
              {product.variants.map(variant => {
                 const price = user 
                    ? (user.role === UserRole.SACOLEIRA ? variant.priceSacoleira : variant.priceRepresentative)
                    : null;

                 return (
                   <div key={variant.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-secondary/30 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                         <div className="space-y-1">
                            {variant.name && (
                                <div className="text-[10px] font-bold text-secondary uppercase">{variant.name}</div>
                            )}
                            <div className="font-bold text-gray-900 text-lg">Ref: {variant.reference}</div>
                            <div className="text-xs text-gray-500">Grade: <span className="font-bold text-gray-700 uppercase">{variant.sizeRange}</span></div>
                         </div>
                         <div className="text-right">
                           {price ? (
                             <div className="text-xl font-black text-primary tracking-tight">R$ {price.toFixed(2)}</div>
                           ) : (
                             <div className="text-[10px] text-secondary font-bold uppercase border border-secondary/20 px-2 py-1 rounded">Restrito</div>
                           )}
                         </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-3">Cores disponíveis</span>
                        <div className="flex flex-wrap gap-4">
                          {variant.colors.map((color, idx) => (
                             <div key={idx} className="flex items-center bg-gray-50 pr-3 rounded-full border border-gray-100">
                                <div 
                                  className="w-7 h-7 rounded-full border border-white shadow-sm mr-2 flex-shrink-0" 
                                  style={{ backgroundColor: color.hex }}
                                ></div>
                                <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap">{color.name}</span>
                             </div>
                          ))}
                        </div>
                      </div>
                   </div>
                 );
              })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
