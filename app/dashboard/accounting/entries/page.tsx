'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline';

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

export default function EntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies');

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

      const response = await fetch(`/api/accounting/entries?companyId=${activeCompany.id}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Asientos cargados:', data);
        setEntries(data);
      } else {
        console.error('Error loading entries:', await response.text());
        alert('Error al cargar los asientos contables');
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      alert('Error al cargar los asientos: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

  const getTotalDebit = (lines: EntryLine[]) => {
    return lines.reduce((sum, line) => sum + Number(line.debit), 0);
  };

  const getTotalCredit = (lines: EntryLine[]) => {
    return lines.reduce((sum, line) => sum + Number(line.credit), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asientos Contables</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los asientos contables de partida doble
          </p>
        </div>
        <Link
          href="/dashboard/accounting/entries/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Asiento
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asientos contables</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando un nuevo asiento contable.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/accounting/entries/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuevo Asiento
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => {
                const totalDebit = getTotalDebit(entry.lines);
                
                return (
                  <tr 
                    key={entry.id}
                    onClick={() => router.push(`/dashboard/accounting/entries/${entry.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        #{entry.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.reference || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      €{formatCurrency(totalDebit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
