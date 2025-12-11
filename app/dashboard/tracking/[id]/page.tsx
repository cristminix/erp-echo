'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

interface Company {
  id: string;
  name: string;
  currency: string;
}

interface Tracking {
  id: string;
  trackingNumber: string;
  description: string;
  status: 'REQUESTED' | 'RECEIVED' | 'PAID' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED';
  carrier?: string | null;
  origin?: string | null;
  destination?: string | null;
  weight?: number | null;
  notes?: string | null;
  requestedDate?: Date | null;
  receivedDate?: Date | null;
  paidDate?: Date | null;
  shippedDate?: Date | null;
  inTransitDate?: Date | null;
  deliveredDate?: Date | null;
  contact?: Contact | null;
  company: Company;
  createdAt: Date;
}

const statusData = [
  { key: 'REQUESTED', label: 'Solicitado', dateKey: 'requestedDate' },
  { key: 'RECEIVED', label: 'Recibido en Oficina', dateKey: 'receivedDate' },
  { key: 'PAID', label: 'Pagado', dateKey: 'paidDate' },
  { key: 'SHIPPED', label: 'Enviado', dateKey: 'shippedDate' },
  { key: 'IN_TRANSIT', label: 'En Tránsito', dateKey: 'inTransitDate' },
  { key: 'DELIVERED', label: 'Llegó', dateKey: 'deliveredDate' },
];

export default function TrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    trackingNumber: '',
    description: '',
    origin: '',
    destination: '',
    carrier: '',
    weight: '',
    notes: '',
  });

  useEffect(() => {
    fetchTracking();
  }, [params.id]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tracking/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTracking(data);
        setFormData({
          trackingNumber: data.trackingNumber,
          description: data.description,
          origin: data.origin || '',
          destination: data.destination || '',
          carrier: data.carrier || '',
          weight: data.weight?.toString() || '',
          notes: data.notes || '',
        });
      } else {
        alert('Error al cargar seguimiento');
        router.push('/dashboard/tracking');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!tracking) return;
    
    if (!confirm(`¿Actualizar estado a "${statusData.find(s => s.key === newStatus)?.label}"?`)) return;

    try {
      const response = await fetch(`/api/tracking/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTracking();
      } else {
        alert('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar estado');
    }
  };

  const handleSaveEdit = async () => {
    if (!tracking) return;

    try {
      const payload = {
        ...formData,
        origin: formData.origin || null,
        destination: formData.destination || null,
        carrier: formData.carrier || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes || null,
      };

      const response = await fetch(`/api/tracking/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsEditMode(false);
        fetchTracking();
      } else {
        alert('Error al actualizar seguimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar seguimiento');
    }
  };

  const getCurrentStatusIndex = () => {
    return statusData.findIndex(s => s.key === tracking?.status);
  };

  const canAdvanceToStatus = (statusKey: string): boolean => {
    const currentIndex = getCurrentStatusIndex();
    const targetIndex = statusData.findIndex(s => s.key === statusKey);
    return targetIndex === currentIndex + 1;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-sm text-gray-500">Cargando seguimiento...</p>
      </div>
    );
  }

  if (!tracking) {
    return null;
  }

  const currentIndex = getCurrentStatusIndex();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Navegación */}
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/dashboard/tracking"
          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
        >
          <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Seguimientos
        </Link>

        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          {isEditMode ? 'Cancelar Edición' : 'Editar'}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Seguimiento #{tracking.trackingNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Creado el {new Date(tracking.createdAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        {/* Información Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {isEditMode ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Seguimiento</label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transportista</label>
                <input
                  type="text"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm text-gray-500">Descripción</p>
                <p className="mt-1 text-base text-gray-900">{tracking.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transportista</p>
                <p className="mt-1 text-base text-gray-900">{tracking.carrier || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Origen</p>
                <p className="mt-1 text-base text-gray-900">{tracking.origin || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Destino</p>
                <p className="mt-1 text-base text-gray-900">{tracking.destination || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Peso</p>
                <p className="mt-1 text-base text-gray-900">
                  {tracking.weight ? `${tracking.weight} kg` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contacto</p>
                <p className="mt-1 text-base text-gray-900">{tracking.contact?.name || '-'}</p>
              </div>
              {tracking.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="mt-1 text-base text-gray-900 whitespace-pre-wrap">{tracking.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Timeline Visual */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Estado del Envío</h2>
          
          <div className="relative">
            {/* Línea de conexión */}
            <div className="absolute top-5 left-5 h-full w-0.5 bg-gray-200" style={{ height: 'calc(100% - 40px)' }}></div>

            <div className="space-y-6">
              {statusData.map((status, index) => {
                const isCompleted = index <= currentIndex;
                const date = tracking[status.dateKey as keyof Tracking] as Date | null;
                const isNext = canAdvanceToStatus(status.key);

                return (
                  <div key={status.key} className="relative flex items-start">
                    {/* Círculo indicador */}
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        isCompleted
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-white border-gray-300'
                      } z-10`}
                    >
                      {isCompleted ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {status.label}
                          </p>
                          {date && (
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>

                        {/* Botón para avanzar */}
                        {isNext && (
                          <button
                            onClick={() => handleStatusChange(status.key)}
                            className="ml-4 px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                          >
                            Marcar como {status.label}
                          </button>
                        )}
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
}
