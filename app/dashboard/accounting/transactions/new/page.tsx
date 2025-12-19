'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTransactionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    url: '',
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Obtener usuario actual
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserId(userData.id);
      }

      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies');
      if (companiesRes.ok) {
        const companies = await companiesRes.json();
        const activeCompany = companies.find((c: any) => c.active);
        if (activeCompany) {
          setCompanyId(activeCompany.id);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.url) {
      alert('Todos los campos son requeridos');
      return;
    }

    if (!userId || !companyId) {
      alert('Error al obtener datos de usuario o empresa');
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch('/api/accounting/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
          companyId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear transacción');
      }

      router.push('/dashboard/accounting/transactions');
    } catch (error: unknown) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al crear transacción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-black">Nueva Transacción</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="TRX001, TRX002..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Nombre de la transacción"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="https://ejemplo.com"
              required
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
