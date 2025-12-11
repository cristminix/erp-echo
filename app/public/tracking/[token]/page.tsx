'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Tracking {
  id: string;
  trackingNumber: string;
  description: string;
  status: string;
  origin: string | null;
  destination: string | null;
  carrier: string | null;
  weight: number | null;
  requestedDate: string;
  receivedDate: string | null;
  paidDate: string | null;
  shippedDate: string | null;
  inTransitDate: string | null;
  deliveredDate: string | null;
  notes: string | null;
  company: {
    name: string;
    logo: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  REQUESTED: 'Solicitado',
  RECEIVED: 'Recibido en Oficina',
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  IN_TRANSIT: 'En Tránsito',
  DELIVERED: 'Entregado',
};

const statusOrder = ['REQUESTED', 'RECEIVED', 'PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];

export default function PublicTrackingPage() {
  const params = useParams();
  const token = params.token as string;
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTracking();
  }, [token]);

  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/public/tracking/${token}`);
      if (response.ok) {
        const data = await response.json();
        setTracking(data);
      } else {
        setError('Seguimiento no encontrado');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDate = (status: string) => {
    if (!tracking) return null;
    const dateMap: Record<string, string | null> = {
      REQUESTED: tracking.requestedDate,
      RECEIVED: tracking.receivedDate,
      PAID: tracking.paidDate,
      SHIPPED: tracking.shippedDate,
      IN_TRANSIT: tracking.inTransitDate,
      DELIVERED: tracking.deliveredDate,
    };
    return dateMap[status];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStatusIndex = tracking ? statusOrder.indexOf(tracking.status) : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{error}</h1>
          <p className="mt-2 text-gray-600">Verifica el enlace de seguimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              {tracking.company.logo && (
                <img src={tracking.company.logo} alt={tracking.company.name} className="h-12 mb-2" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{tracking.company.name}</h1>
              <p className="text-sm text-gray-500">Seguimiento de Envío</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Número de Seguimiento</p>
              <p className="text-2xl font-bold text-gray-900">{tracking.trackingNumber}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Estado del Envío</h2>
          <div className="relative">
            {statusOrder.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const statusDate = getStatusDate(status);

              return (
                <div key={status} className="relative pb-8 last:pb-0">
                  {index !== statusOrder.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-full ${
                        isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div className="relative flex items-start">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        isCompleted
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isCompleted ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {statusLabels[status]}
                      </p>
                      {statusDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(statusDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalles del Envío */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del Envío</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{tracking.description}</dd>
            </div>
            {tracking.origin && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Origen</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.origin}</dd>
              </div>
            )}
            {tracking.destination && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Destino</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.destination}</dd>
              </div>
            )}
            {tracking.carrier && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Transportista</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.carrier}</dd>
              </div>
            )}
            {tracking.weight && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Peso</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.weight} kg</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contacto */}
        {tracking.contact && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Información de Contacto</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.contact.name}</dd>
              </div>
              {tracking.contact.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tracking.contact.email}</dd>
                </div>
              )}
              {tracking.contact.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tracking.contact.phone}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
