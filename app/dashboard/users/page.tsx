'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/DataTable';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  defaultCompany?: {
    id: string;
    name: string;
  } | null;
  createdById: string | null;
  createdAt: string;
  _count: {
    createdUsers: number;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };



  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Rol',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {user.role === 'admin' ? 'Administrador' : 'Usuario'}
        </span>
      )
    },
    { 
      key: 'defaultCompany', 
      label: 'Empresa',
      render: (user: User) => user.defaultCompany?.name || 'Sin empresa'
    },
    { 
      key: 'active', 
      label: 'Estado',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.active ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    { 
      key: 'type', 
      label: 'Tipo',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.createdById ? 'bg-gray-100 text-gray-800' : 'bg-indigo-100 text-indigo-800'
        }`}>
          {user.createdById ? 'Creado' : 'Principal'}
        </span>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DataTable
        title="Usuarios"
        data={users}
        columns={columns}
        createLink="/dashboard/users/new"
        createLabel="Nuevo Usuario"
        onEdit={(user) => router.push(`/dashboard/users/${user.id}`)}
        emptyMessage="No hay usuarios registrados"
        showColumnToggle={false}
      />
    </div>
  );
}
