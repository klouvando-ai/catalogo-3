
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole, Product, SizeRange, Color, ReferenceDefinition, Category, UserAccount } from '../types';
import { SIZE_OPTIONS } from '../constants';
import { Trash2, Plus, X, Upload, Edit, ShoppingBag, Search, Tag, Users, Star, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    addProduct, updateProduct, getProduct, 
    references, addReference, updateReference, deleteReference,
    categories, addCategory, updateCategory, deleteCategory
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
    <div className="max-w-6xl mx-auto py-6 px-3 md:py-8 md:px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">Painel Admin</h1>
        
        {/* Tabs Mobile: Rolagem horizontal */}
        <div className="w-full overflow-x-auto no-scrollbar bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex flex-nowrap">
            <button onClick={() => setActiveTab('products')} className={`flex items-center flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
                <ShoppingBag className="w-4 h-4 mr-1.5" /> Vitrine
            </button>
            <button onClick={() => setActiveTab('references')} className={`flex items-center flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'references' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
                <Search className="w-4 h-4 mr-1.5" /> Refs
            </button>
            <button onClick={() => setActiveTab('categories')} className={`flex items-center flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
                <Tag className="w-4 h-4 mr-1.5" /> Categorias
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
                <Users className="w-4 h-4 mr-1.5" /> Usuários
            </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'products' && <ProductForm productId={id} />}
        {activeTab === 'references' && <ReferenceManager references={references} onAdd={addReference} onUpdate={updateReference} onDelete={deleteReference} categories={categories} />}
        {activeTab === 'categories' && <CategoryManager categories={categories} onAdd={addCategory} onUpdate={updateCategory} onDelete={deleteCategory} />}
        {activeTab === 'users' && <UserManager />}
      </div>
    </div>
  );
};

// CategoryManager otimizado
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
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border">
      <h2 className="text-lg font-bold mb-4 font-serif">Categorias do Filtro</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nova categoria..." className="flex-1 border p-2.5 rounded-xl text-sm outline-none focus:border-secondary" />
        <button className="bg-primary text-white px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm">{editingId ? 'OK' : 'Add'}</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="font-bold text-sm text-gray-700">{cat.name}</span>
            <div className="flex gap-1">
              <button onClick={() => { setName(cat.name); setEditingId(cat.id); }} className="p-2 text-blue-500 hover:bg-white rounded-lg transition-colors"><Edit size={16}/></button>
              <button onClick={() => { if(confirm('Excluir?')) onDelete(cat.id)}} className="p-2 text-red-400 hover:bg-white rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// UserManager otimizado
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
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border">
      <h2 className="text-lg font-bold mb-4 font-serif">Contas de Acesso</h2>
      <form onSubmit={handleSubmit} className="space-y-3 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" />
          <input type="password" placeholder="Nova Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" />
          <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full border p-2.5 rounded-xl text-sm bg-white">
            <option value={UserRole.ADMIN}>ADMIN</option>
            <option value={UserRole.REPRESENTATIVE}>REPRESENTANTE</option>
            <option value={UserRole.SACOLEIRA}>SACOLEIRA</option>
          </select>
        </div>
        <button className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md">{editingId ? 'Atualizar Usuário' : 'Criar Novo Usuário'}</button>
      </form>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="p-4 bg-gray-50 border rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">{u.username}</div>
              <div className="text-[10px] font-black text-secondary uppercase">{u.role}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setUsername(u.username); setRole(u.role); setEditingId(u.id); }} className="p-2 text-blue-500 bg-white shadow-sm rounded-xl"><Edit size={16}/></button>
              <button onClick={async () => { if(confirm('Excluir?')) { await api.users.delete(u.id); fetchUsers(); } }} className="p-2 text-red-400 bg-white shadow-sm rounded-xl"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ReferenceManager otimizado
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

    const handleRemoveColor = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setColors(prev => prev.filter((_, i) => i !== index));
        if (editingColorIndex === index) {
            setEditingColorIndex(null);
            setNewColorName('');
            setNewColorHex('#000000');
        } else if (editingColorIndex !== null && editingColorIndex > index) {
            setEditingColorIndex(prev => prev !== null ? prev - 1 : null);
        }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border h-fit lg:sticky lg:top-24">
                <h2 className="text-lg font-bold mb-5 font-serif text-primary">{editingId ? 'Editar Ref.' : 'Nova Ref.'}</h2>
                <form onSubmit={handleSave} className="space-y-3">
                    <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" placeholder="Código (ex: V01)" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" placeholder="Nome Interno" />
                    <div className="grid grid-cols-2 gap-2">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white">
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select value={sizeRange} onChange={e => setSizeRange(e.target.value as SizeRange)} className="w-full border p-2.5 rounded-xl text-sm bg-white">
                            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.01" value={priceRep} onChange={e => setPriceRep(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" placeholder="Preço Rep." />
                        <input type="number" step="0.01" value={priceSac} onChange={e => setPriceSac(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" placeholder="Preço Sac." />
                    </div>
                    
                    <div className="pt-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Cores desta referência (Toque para editar)</span>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {colors.map((c, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => { setNewColorName(c.name); setNewColorHex(c.hex); setEditingColorIndex(i); }} 
                                    className={`cursor-pointer flex items-center bg-gray-50 border rounded-full pl-1 pr-1.5 py-1 text-[10px] font-bold transition-all group ${editingColorIndex === i ? 'ring-2 ring-secondary border-secondary' : 'hover:border-gray-300'}`}
                                >
                                    <span className="w-4 h-4 rounded-full mr-2 shadow-sm border border-white flex-shrink-0" style={{backgroundColor: c.hex}}></span> 
                                    <span className="mr-1">{c.name}</span>
                                    <button 
                                        type="button" 
                                        onClick={(e) => handleRemoveColor(e, i)}
                                        className="p-0.5 rounded-full hover:bg-red-500 hover:text-white text-gray-400 transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="h-10 w-12 border rounded-xl p-1 bg-white cursor-pointer" />
                            <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Cor" className="flex-1 border p-2 rounded-xl text-sm" />
                            <button type="button" onClick={() => { if(newColorName) { if(editingColorIndex !== null) { const u = [...colors]; u[editingColorIndex]={name:newColorName, hex:newColorHex}; setColors(u); setEditingColorIndex(null); } else { setColors([...colors, {name:newColorName, hex:newColorHex}]); } setNewColorName(''); } }} className="bg-secondary text-white p-2.5 rounded-xl shadow-sm hover:scale-105 transition-transform"><Plus size={20}/></button>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-md mt-4 transition-transform active:scale-95">{editingId ? 'Salvar Alterações' : 'Cadastrar Referência'}</button>
                    {editingId && <button type="button" onClick={resetForm} className="w-full text-gray-400 text-xs py-2">Cancelar Edição</button>}
                </form>
            </div>
            <div className="lg:col-span-2 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Filtrar referências..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border rounded-2xl bg-white shadow-sm text-sm outline-none focus:border-secondary" />
                </div>
                <div className="space-y-2">
                    {references.filter(r => r.code.toLowerCase().includes(searchTerm.toLowerCase()) || r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(ref => (
                        <div key={ref.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center font-black text-primary text-sm shadow-inner">{ref.code}</div>
                                <div>
                                    <div className="font-bold text-sm">{ref.name || 'Sem nome'}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{ref.category} | {ref.sizeRange}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(ref)} className="p-2 text-blue-500 bg-gray-50 rounded-xl hover:bg-white transition-colors"><Edit size={16}/></button>
                                <button onClick={() => {if(confirm('Apagar?')) onDelete(ref.id)}} className="p-2 text-red-400 bg-gray-50 rounded-xl hover:bg-white transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProductForm: React.FC<{ productId?: string }> = ({ productId }) => {
    const { addProduct, updateProduct, deleteProduct, getProduct, references, categories } = useData();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [fabric, setFabric] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [coverImageIndex, setCoverImageIndex] = useState(0);
    const [isFeatured, setIsFeatured] = useState(false);
    const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if(categories.length > 0 && !category) setCategory(categories[0].name);
        if (productId) {
            const p = getProduct(productId);
            if (p) { 
                setName(p.name); 
                setCategory(p.category); 
                setImages(p.images); 
                setSelectedRefIds(p.referenceIds || []); 
                setDescription(p.description || ''); 
                setFabric(p.fabric || '');
                setCoverImageIndex(p.coverImageIndex || 0);
                setIsFeatured(p.isFeatured || false);
            }
        }
    }, [productId, getProduct, categories]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        // Fix: Explicitly cast file to File to prevent 'unknown' type error during iteration
        for (const file of Array.from(e.target.files)) {
            try {
                const url = await api.upload(file as File);
                setImages(prev => [...prev, url]);
            } catch (err) {
                alert('Erro ao enviar imagem. Certifique-se de que é um formato válido (JPG, PNG ou WEBP).');
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        if (coverImageIndex === index) setCoverImageIndex(0);
        else if (coverImageIndex > index) setCoverImageIndex(prev => prev - 1);
    };

    const handleDeleteProduct = async () => {
        if (productId && confirm('Tem certeza que deseja excluir este anúncio permanentemente?')) {
            await deleteProduct(productId);
            navigate('/');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || images.length === 0 || selectedRefIds.length === 0) {
            alert('Preencha nome, fotos e vincule ao menos uma referência.');
            return;
        }
        setIsSaving(true);
        const p: Product = { 
            id: productId || crypto.randomUUID(), 
            name, 
            description, 
            fabric, 
            category, 
            images, 
            coverImageIndex, 
            isFeatured, 
            referenceIds: selectedRefIds, 
            variants: [], 
            createdAt: Date.now() 
        };
        productId ? await updateProduct(p) : await addProduct(p);
        navigate('/');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border space-y-5">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-serif">{productId ? 'Editar' : 'Publicar'} na Vitrine</h2>
                {productId && (
                    <button 
                        type="button" 
                        onClick={handleDeleteProduct}
                        className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors font-bold text-sm border border-red-100"
                    >
                        <Trash2 size={18} />
                        <span className="hidden sm:inline">Excluir Anúncio</span>
                    </button>
                )}
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                        <div className="font-bold text-sm">Produto em Destaque</div>
                        <div className="text-[10px] text-gray-500">Exibido no topo da página e com selo especial</div>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isFeatured ? 'bg-secondary' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFeatured ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Título Comercial do Produto" className="w-full border p-3 rounded-xl text-sm" />
                
                <div className="grid grid-cols-2 gap-3">
                    <select value={category} onChange={e => setCategory(e.target.value)} className="border p-3 rounded-xl text-sm bg-white">
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <input type="text" value={fabric} onChange={e => setFabric(e.target.value)} placeholder="Tecido (ex: Linho)" className="border p-3 rounded-xl text-sm" />
                </div>

                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição curta..." className="w-full border p-3 rounded-xl text-sm h-24" />
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Fotos (Suporta JPG, PNG, WEBP - Toque para escolher principal)</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {images.map((img, i) => (
                        <div key={i} className="relative group">
                            <div 
                                onClick={() => setCoverImageIndex(i)}
                                title="Clique para definir como foto principal"
                                className={`w-24 h-32 cursor-pointer relative rounded-xl overflow-hidden border-2 transition-all ${coverImageIndex === i ? 'border-secondary shadow-lg scale-105 ring-2 ring-secondary/20' : 'border-gray-100 opacity-80 hover:opacity-100'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" alt={`Imagem ${i}`} />
                                {coverImageIndex === i && (
                                    <div className="absolute top-1 right-1 bg-secondary text-white rounded-full p-0.5 shadow-md">
                                        <Star size={12} fill="currentColor" />
                                    </div>
                                )}
                                <div className={`absolute bottom-0 left-0 right-0 py-1 text-center text-[8px] font-black uppercase transition-opacity ${coverImageIndex === i ? 'bg-secondary text-white' : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'}`}>
                                    {coverImageIndex === i ? 'Foto Principal' : 'Definir Principal'}
                                </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:scale-110 transition-transform"><X size={12}/></button>
                        </div>
                    ))}
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-400">
                        <Upload size={24}/>
                        <span className="text-[8px] font-bold mt-1">ADD FOTO</span>
                        <span className="text-[6px] opacity-60">PNG / JPG</span>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUpload} 
                        multiple 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden" 
                    />
                </div>
            </div>

            <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Vincular Referências (Pelo menos uma)</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-52 overflow-y-auto p-3 bg-accent/30 rounded-2xl border border-gray-100 no-scrollbar">
                    {references.map(ref => (
                        <div key={ref.id} onClick={() => setSelectedRefIds(prev => prev.includes(ref.id) ? prev.filter(x => x !== ref.id) : [...prev, ref.id])} className={`p-2.5 border rounded-xl text-[10px] font-bold cursor-pointer transition-all ${selectedRefIds.includes(ref.id) ? 'bg-primary text-white border-primary shadow-md scale-95' : 'bg-white text-gray-600 border-gray-200 shadow-sm opacity-60'}`}>
                            <div className="flex justify-between items-start">
                                <div className="truncate">{ref.code}</div>
                                {selectedRefIds.includes(ref.id) && <CheckCircle2 size={10} className="text-secondary" />}
                            </div>
                            <div className="truncate opacity-75 font-normal">{ref.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            <button disabled={isSaving} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:scale-95 disabled:bg-gray-400">
                {isSaving ? 'Salvando...' : 'Salvar e Publicar na Vitrine'}
            </button>
        </form>
    );
};

export default AdminDashboard;
