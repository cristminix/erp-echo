'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/DataTable';

interface Company {
  id: string;
  name: string;
  nif?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
  _count?: {
    employees: number;
    payrolls: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/activate`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchCompanies();
      }
    } catch (error) {
      console.error('Error activating company:', error);
    }
  };



  const columns = [
    { 
      key: 'name', 
      label: 'Nombre',
      sortable: true,
      searchable: true
    },
    { 
      key: 'nif', 
      label: 'NIF',
      sortable: true,
      searchable: true,
      render: (company: Company) => company.nif || '-'
    },
    { 
      key: 'email', 
      label: 'Email',
      sortable: true,
      searchable: true,
      render: (company: Company) => company.email || '-'
    },
    { 
      key: 'phone', 
      label: 'Teléfono',
      searchable: true,
      render: (company: Company) => company.phone || '-'
    },
    { 
      key: 'city', 
      label: 'Ciudad',
      sortable: true,
      searchable: true,
      render: (company: Company) => company.city || '-'
    },
    { 
      key: 'active', 
      label: 'Estado',
      render: (company: Company) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            company.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {company.active ? 'Activa' : 'Inactiva'}
          </span>
          {!company.active && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleActivate(company.id);
              }}
              className="text-teal-600 hover:text-teal-900 font-medium text-xs"
            >
              Activar
            </button>
          )}
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DataTable
        title="Empresas"
        data={companies}
        columns={columns}
        createLink="/dashboard/companies/new"
        createLabel="Nueva Empresa"
        onEdit={(company) => router.push(`/dashboard/companies/${company.id}`)}
        emptyMessage="No hay empresas registradas"
        showColumnToggle={false}
      />
    </div>
  );
}
