
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon } from 'lucide-react';
import { APP_NAME } from '../constants';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Usuário ou senha inválidos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-4xl font-serif font-bold text-primary mb-2">{APP_NAME}</h2>
          <p className="mt-2 text-sm text-gray-600">Área restrita para Representantes e Sacoleiras</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm text-center">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" required className="w-full px-3 py-3 pl-10 border rounded-t-md focus:ring-primary focus:border-primary" placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="password" required className="w-full px-3 py-3 pl-10 border rounded-b-md focus:ring-primary focus:border-primary" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-gray-800 disabled:bg-gray-400">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
