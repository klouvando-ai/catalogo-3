
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole, Product, SizeRange, Color, ReferenceDefinition, Category, UserAccount } from '../types';
import { SIZE_OPTIONS } from '../constants';
import { Trash2, Plus, X, Upload, Check, Loader2, Edit, RefreshCw, ShoppingBag, Search, Tag, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    addProduct, updateProduct, getProduct, 
    references, addReference, updateReference, deleteReference,
    categories, addCategory, updateCategory, deleteCategory,
    isLoading: isDataLoading 
  } = useData();
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'products' | 'references' | 'categories' | 'users'>('products');

  useEffect(() => {
    if (id) setActiveTab('products');
  }, [id]);

  if (!user || user.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center font-serif text-xl">Acesso Negado</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-serif font-bold text-primary">Painel Administrativo</h1>
        
        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex flex-wrap justify-center">
            <button onClick={() => setActiveTab('products')} className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-primary text-white shadow' : 'text-gray-500'}`}>
                <ShoppingBag className="w-4 h-4 mr-2" /> Vitrine
            </button>
            <button onClick={() => setActiveTab('references')} className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'references' ? 'bg-primary text-white shadow' : 'text-gray-500'}`}>
                <Search className="w-4 h-4 mr-2" /> Refs
            </button>
            <button onClick={() => setActiveTab('categories')} className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-primary text-white shadow' : 'text-gray-500'}`}>
                <Tag className="w-4 h-4 mr-2" /> Categorias
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-primary text-white shadow' : 'text-gray-500'}`}>
                <Users className="w-4 h-4 mr-2" /> Usuários
            </button>
        </div>
      </div>

      {activeTab === 'products' && <ProductForm productId={id} />}
      {activeTab === 'references' && <ReferenceManager references={references} onAdd={addReference} onUpdate={updateReference} onDelete={deleteReference} categories={categories} />}
      {activeTab === 'categories' && <CategoryManager categories={categories} onAdd={addCategory} onUpdate={updateCategory} onDelete={deleteCategory} />}
      {activeTab === 'users' && <UserManager />}
    </div>
  );
};

// Gerenciador de Categorias
const CategoryManager: React.FC<{
  categories: Category[];
  onAdd: (c: Category) => Promise<void>;
  onUpdate: (c: Category) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ categories, onAdd, onUpdate, onDelete }) => {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (editingId) {
      await onUpdate({ id: editingId, name, orderIndex: 0 });
    } else {
      await onAdd({ id: crypto.randomUUID(), name, orderIndex: categories.length });
    }
    setName(''); setEditingId(null);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-bold mb-6">Gerenciar Categorias (Filtros)</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Novo nome de categoria..." className="flex-1 border p-2 rounded-lg" />
        <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold">{editingId ? 'Atualizar' : 'Adicionar'}</button>
      </form>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <span className="font-medium">{cat.name}</span>
            <div className="flex gap-2">
              <button onClick={() => { setName(cat.name); setEditingId(cat.id); }} className="p-2 text-blue-500"><Edit size={18}/></button>
              <button onClick={() => onDelete(cat.id)} className="p-2 text-red-400"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Gerenciador de Usuários
const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.REPRESENTATIVE);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchUsers = async () => setUsers(await api.users.list());
  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.users.update(editingId, { username, password: password || undefined, role });
    } else {
      await api.users.create({ id: crypto.randomUUID(), username, password, role, createdAt: Date.now() });
    }
    setUsername(''); setPassword(''); setEditingId(null); fetchUsers();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-bold mb-6">Gerenciar Acessos</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
        <div>
          <label className="block text-xs font-bold mb-1">Usuário</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Senha {editingId && '(deixe vazio p/ não alterar)'}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Nível</label>
          <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full border p-2 rounded">
            <option value={UserRole.ADMIN}>ADMIN</option>
            <option value={UserRole.REPRESENTATIVE}>REPRESENTANTE</option>
            <option value={UserRole.SACOLEIRA}>SACOLEIRA</option>
          </select>
        </div>
        <button className="bg-primary text-white py-2 rounded font-bold">{editingId ? 'Salvar' : 'Criar'}</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="p-3 text-left">Usuário</th><th className="p-3 text-left">Nível</th><th className="p-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-bold">{u.username}</td>
                <td className="p-3"><span className="bg-gray-200 px-2 py-1 rounded text-[10px] font-bold">{u.role}</span></td>
                <td className="p-3 text-right">
                  <button onClick={() => { setUsername(u.username); setRole(u.role); setEditingId(u.id); }} className="text-blue-500 mr-2"><Edit size={16}/></button>
                  <button onClick={async () => { if(confirm('Excluir?')) { await api.users.delete(u.id); fetchUsers(); } }} className="text-red-400"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componentes Reutilizados (Ajustados para usar as categorias dinâmicas)
const ReferenceManager: React.FC<{
    references: ReferenceDefinition[];
    categories: Category[];
    onAdd: (r: ReferenceDefinition) => Promise<void>;
    onUpdate: (r: ReferenceDefinition) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}> = ({ references, categories, onAdd, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [sizeRange, setSizeRange] = useState<SizeRange>(SizeRange.P_GG);
    const [priceRep, setPriceRep] = useState('');
    const [priceSac, setPriceSac] = useState('');
    const [colors, setColors] = useState<Color[]>([]);
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [newColorName, setNewColorName] = useState('');
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { if(categories.length > 0 && !category) setCategory(categories[0].name); }, [categories]);

    const resetForm = () => {
        setEditingId(null); setCode(''); setName(''); setCategory(categories[0]?.name || '');
        setSizeRange(SizeRange.P_GG); setPriceRep(''); setPriceSac(''); setColors([]);
        setNewColorName(''); setNewColorHex('#000000'); setEditingColorIndex(null);
    };

    const startEdit = (ref: ReferenceDefinition) => {
        setEditingId(ref.id); setCode(ref.code); setName(ref.name); setCategory(ref.category);
        setSizeRange(ref.sizeRange); setPriceRep(ref.priceRepresentative.toString());
        setPriceSac(ref.priceSacoleira.toString()); setColors([...ref.colors]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const refData: ReferenceDefinition = {
            id: editingId || crypto.randomUUID(), code, name, category, sizeRange,
            priceRepresentative: parseFloat(priceRep), priceSacoleira: parseFloat(priceSac),
            colors, createdAt: Date.now()
        };
        editingId ? await onUpdate(refData) : await onAdd(refData);
        resetForm();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24 border">
                <h2 className="text-xl font-bold mb-6 text-primary">{editingId ? 'Editar Referência' : 'Nova Referência'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full border p-2 rounded" placeholder="Código" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" placeholder="Nome Interno" />
                    <div className="grid grid-cols-2 gap-2">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded">
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select value={sizeRange} onChange={e => setSizeRange(e.target.value as SizeRange)} className="w-full border p-2 rounded">
                            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.01" value={priceRep} onChange={e => setPriceRep(e.target.value)} className="w-full border p-2 rounded" placeholder="Preço Rep." />
                        <input type="number" step="0.01" value={priceSac} onChange={e => setPriceSac(e.target.value)} className="w-full border p-2 rounded" placeholder="Preço Sac." />
                    </div>
                    <div className="border-t pt-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {colors.map((c, i) => (
                                <div key={i} onClick={() => { setNewColorName(c.name); setNewColorHex(c.hex); setEditingColorIndex(i); }} className={`cursor-pointer flex items-center bg-gray-50 border rounded-full px-3 py-1 text-xs ${editingColorIndex === i ? 'ring-2 ring-primary' : ''}`}>
                                    <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: c.hex}}></span> {c.name}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-1">
                            <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="h-10 w-10 border rounded" />
                            <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Cor" className="flex-1 border p-2 rounded text-sm" />
                            <button type="button" onClick={() => { if(newColorName) { if(editingColorIndex !== null) { const u = [...colors]; u[editingColorIndex]={name:newColorName, hex:newColorHex}; setColors(u); setEditingColorIndex(null); } else { setColors([...colors, {name:newColorName, hex:newColorHex}]); } setNewColorName(''); } }} className="bg-primary text-white p-2 rounded"><Plus size={18}/></button>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-3 rounded font-bold mt-4">{editingId ? 'Atualizar' : 'Salvar'}</button>
                </form>
            </div>
            <div className="lg:col-span-2">
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mb-4 p-3 border rounded-xl" />
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                    <table className="min-w-full">
                        <thead className="bg-gray-50"><tr><th className="p-4 text-left">Ref</th><th className="p-4 text-left">Info</th><th className="p-4 text-right">Ações</th></tr></thead>
                        <tbody className="divide-y">
                            {references.filter(r => r.code.includes(searchTerm) || r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(ref => (
                                <tr key={ref.id}>
                                    <td className="p-4 font-bold">{ref.code}</td>
                                    <td className="p-4 text-xs"><b>{ref.name}</b><br/>{ref.category} | {ref.sizeRange}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => startEdit(ref)} className="text-blue-500 mr-2"><Edit size={18}/></button>
                                        <button onClick={() => onDelete(ref.id)} className="text-red-400"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ProductForm: React.FC<{ productId?: string }> = ({ productId }) => {
    const { addProduct, updateProduct, getProduct, references, categories } = useData();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);

    useEffect(() => {
        if(categories.length > 0 && !category) setCategory(categories[0].name);
        if (productId) {
            const p = getProduct(productId);
            if (p) { setName(p.name); setCategory(p.category); setImages(p.images); setSelectedRefIds(p.referenceIds || []); }
        }
    }, [productId, getProduct, categories]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        for (const file of Array.from(e.target.files)) {
            const url = await api.upload(file);
            setImages(prev => [...prev, url]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const p: Product = { id: productId || crypto.randomUUID(), name, description: '', fabric: '', category, images, coverImageIndex: 0, isFeatured: false, referenceIds: selectedRefIds, variants: [], createdAt: Date.now() };
        productId ? await updateProduct(p) : await addProduct(p);
        navigate('/');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border space-y-6">
            <h2 className="text-xl font-bold">Gerenciar Vitrine</h2>
            <div className="grid grid-cols-2 gap-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Título" className="col-span-2 border p-3 rounded" />
                <select value={category} onChange={e => setCategory(e.target.value)} className="border p-3 rounded">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>
            <div className="flex flex-wrap gap-2">
                {images.map((img, i) => <img key={i} src={img} className="w-20 h-28 object-cover rounded" />)}
                <div onClick={() => fileInputRef.current?.click()} className="w-20 h-28 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50"><Upload size={20}/></div>
                <input type="file" ref={fileInputRef} onChange={handleUpload} multiple className="hidden" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-4 bg-gray-50 border rounded">
                {references.map(ref => (
                    <div key={ref.id} onClick={() => setSelectedRefIds(prev => prev.includes(ref.id) ? prev.filter(x => x !== ref.id) : [...prev, ref.id])} className={`p-2 border rounded text-[10px] cursor-pointer ${selectedRefIds.includes(ref.id) ? 'bg-primary text-white' : 'bg-white'}`}>
                        <b>{ref.code}</b><br/>{ref.name}
                    </div>
                ))}
            </div>
            <button className="w-full bg-primary text-white py-4 rounded-xl font-bold">Salvar Vitrine</button>
        </form>
    );
};

export default AdminDashboard;
