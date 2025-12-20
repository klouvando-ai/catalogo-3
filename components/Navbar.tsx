
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';
import { LogOut, User, PlusCircle, Search, X } from 'lucide-react';
import { APP_NAME } from '../constants';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { categories } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Todos';
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => { setSearchTerm(searchParams.get('q') || ''); }, [searchParams]);

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category === 'Todos') params.delete('category');
    else params.set('category', category);
    navigate(`/?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('q', value);
    else params.delete('q');
    if (location.pathname !== '/') navigate(`/?${params.toString()}`);
    else setSearchParams(params);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:h-20 items-center py-4 md:py-0 gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <span className="font-serif text-3xl font-bold text-primary">{APP_NAME}</span>
            </div>
            <div className="md:hidden flex gap-2">
               {user ? <button onClick={logout} className="p-2"><LogOut size={20}/></button> : <Link to="/login" className="p-2"><User size={20}/></Link>}
            </div>
          </div>

          <div className="w-full md:w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" className="w-full pl-10 pr-10 py-2 border rounded-full bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange} />
            {searchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" onClick={() => { setSearchTerm(''); handleSearchChange({target: {value: ''}} as any); }} />}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user?.role === UserRole.ADMIN && <Link to="/admin" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"><PlusCircle className="mr-2 h-4 w-4" /> Admin</Link>}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right"><div className="text-sm font-bold">{user.username}</div><div className="text-[10px] text-secondary uppercase font-bold">{user.role}</div></div>
                <button onClick={logout} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><LogOut size={20} /></button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center text-gray-500 font-medium"><User className="h-5 w-5 mr-1" /> Entrar</Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center overflow-x-auto no-scrollbar space-x-2 py-2 border-t mt-2">
             {location.pathname === '/' && (
               <>
                 <button onClick={() => handleCategoryClick('Todos')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border ${activeCategory === 'Todos' ? 'bg-primary text-white' : 'bg-white text-gray-600 border-gray-200'}`}>Todos</button>
                 {categories.map(cat => (
                   <button key={cat.id} onClick={() => handleCategoryClick(cat.name)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border ${activeCategory === cat.name ? 'bg-primary text-white' : 'bg-white text-gray-600 border-gray-200'}`}>{cat.name}</button>
                 ))}
               </>
             )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
