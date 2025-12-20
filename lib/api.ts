
const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na API' }));
    throw new Error(error.message || 'Falha na requisição');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (credentials: any) => request<any>('/login', { method: 'POST', body: JSON.stringify(credentials) }),
  },
  users: {
    list: () => request<any[]>('/users'),
    create: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => request<any[]>('/categories'),
    create: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  references: {
    list: () => request<any[]>('/references'),
    create: (data: any) => request<any>('/references', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/references/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/references/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: () => request<any[]>('/products'),
    create: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  },
  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Falha no upload');
    const result = await response.json();
    return result.url;
  }
};
