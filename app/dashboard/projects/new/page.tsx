'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  type: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#10b981',
    startDate: '',
    endDate: '',
    productId: '',
    salePrice: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (activeCompany) {
        const res = await fetch(`/api/products?companyId=${activeCompany.id}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: activeCompany.id,
          productId: formData.productId || undefined,
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/projects');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Nuevo Proyecto</h1>
        <p className="text-gray-600 mt-1">Crea un nuevo proyecto para organizar tus tareas</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Nombre del Proyecto *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ej: Desarrollo Web"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              placeholder="Describe el proyecto..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto/Servicio para Facturación
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Sin producto asociado</option>
                {products.filter(p => p.type === 'service').map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name} ({product.price}€)
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Precio de Venta del Proyecto (€)"
              type="number"
              step="0.01"
              min="0"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              placeholder="ej: 5000.00"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>

            <Input
              label="Fecha de Inicio"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />

            <Input
              label="Fecha de Fin"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/dashboard/projects">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
