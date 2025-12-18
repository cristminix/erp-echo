                                                                                                                                                                                                                                                        ≤'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Account {
  code: string;
  name: string;
}

interface EntryLine {
  id: string;
  accountId: string;
  account: Account;
  description: string | null;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  number: string;
  date: string;
  reference: string | null;
  description: string;
  lines: EntryLine[];
}

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, []);

  const loadEntry = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Por favor inicia sesión');
        return;
      }

      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!companiesRes.ok) {
        alert('Error al cargar las empresas');
        return;
      }

      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        alert('Por favor selecciona una compañía primero');
        return;
      }

      const response = await fetch(`/api/accounting/entries?companyId=${activeCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const foundEntry = data.find((e: JournalEntry) => e.id === params.id);
        if (foundEntry) {
          setEntry(foundEntry);
        } else {
          alert('Asiento no encontrado');
          router.push('/dashboard/accounting/entries');
        }
      } else {
        alert('Error al cargar el asiento');
      }
    } catch (error) {
      console.error('Error loading entry:', error);
      alert('Error al cargar el asiento');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTotalDebit = () => {
    if (!entry) return 0;
    return entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
  };

  const getTotalCredit = () => {
    if (!entry) return 0;
    return entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  const totalDebit = getTotalDebit();
  const totalCredit = getTotalCredit();

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/accounting/entries')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a la lista
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Cabecera del asiento */}
        <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Asiento #{entry.number}
                </h1>
                {entry.reference && (
                  <span className="text-sm text-gray-500">
                    Ref: {entry.reference}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {entry.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Fecha: {formatDate(entry.date)}
              </div>
              <div className="mt-1 text-xl font-bold text-gray-900">
                €{formatCurrency(totalDebit)}
              </div>
            </div>
          </div>
        </div>

        {/* Líneas del asiento */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuenta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debe
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Haber
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entry.lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {line.account.code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {line.account.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {line.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {Number(line.debit) > 0 ? `€${formatCurrency(Number(line.debit))}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {Number(line.credit) > 0 ? `€${formatCurrency(Number(line.credit))}` : '-'}
                  </td>
                </tr>
              ))}
              {/* Totales */}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={2} className="px-6 py-4 text-right text-sm text-gray-900">
                  TOTALES:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  €{formatCurrency(totalDebit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  €{formatCurrency(totalCredit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
